import * as vscode from 'vscode';
import { resolveSfxUri } from '../audio/sfxPlayer';
import { readSettings } from '../config/settings';
import {
  bigFollowUpCopy,
  mediumFollowUpCopy,
} from '../orbit/copy';
import { OrbitStore, type OrbitWinResult } from '../orbit/store';
import {
  countsForOrbitStreak,
  localDayKey,
  toOrbitWinSize,
} from '../orbit/winMapping';
import { getPack } from '../packs/registry';
import { pickCaption } from './captions';
import { classifyKind, resolveDisplay } from './classifier';
import { CELEBRATION_DURATION_MS } from './durations';
import { CelebrationHost, type CelebrationShowArgs } from './host';
import { capturePanelFocus, PanelReturnFocus } from './panelFocus';
import { resolveSurface } from './surface';
import { CelebrationThrottle } from './throttle';
import { WinKind } from './types';
import { pickCelebrationVisual } from './visuals';
import { orbitalLogCelebrate, orbitalLogSkip } from '../util/log';

export interface CelebrationMeta {
  fullSuite?: boolean;
  returnFocus?: PanelReturnFocus;
  terminalNative?: boolean;
  streak?: number;
}

export class CelebrationEngine {
  private readonly throttle = new CelebrationThrottle();
  private celebrationIndex = 0;
  private static readonly FOLLOW_UP_DELAY_MS = 1400;

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly host: CelebrationHost,
    private readonly orbitStore: OrbitStore,
  ) {}

  handle(kind: WinKind, meta?: CelebrationMeta): void {
    void this.showCelebration(kind, meta, kind === 'preview');
  }

  preview(): void {
    void this.showCelebration('preview', { returnFocus: 'none' }, true);
  }

  dispose(): void {
    this.host.dispose();
  }

  private async showCelebration(
    kind: WinKind,
    meta: CelebrationMeta | undefined,
    bypassThrottle: boolean,
  ): Promise<void> {
    const settings = readSettings(() => vscode.workspace.getConfiguration('orbital'));

    if (!settings.celebrationsEnabled) {
      orbitalLogSkip('celebrations disabled in settings', kind);
      return;
    }

    const size = classifyKind(kind, meta);

    if (!bypassThrottle && !this.throttle.allow({ kind, size })) {
      orbitalLogSkip('throttled (small win — retry in ~45s)', kind);
      return;
    }

    const mode = resolveDisplay(kind, size, settings.intensity, this.celebrationIndex);
    const visual = pickCelebrationVisual(settings.pack, mode);
    const picked = pickCaption(kind, settings.pack);
    const packDef = getPack(settings.pack);
    const fallbackDisplay = settings.display === 'overlay' ? 'overlay' : 'panel';
    const surface = resolveSurface(
      kind,
      size,
      settings.surfaces,
      settings.intensity,
      meta,
      fallbackDisplay,
    );
    const focusSnapshot = capturePanelFocus(meta?.returnFocus);

    const reduceMotion = settings.reduceMotion === 'always';
    const dataReduceAuto = settings.reduceMotion === 'auto';
    const durationMs =
      mode === 'toast' ? CELEBRATION_DURATION_MS.toast : CELEBRATION_DURATION_MS.overlay;

    const sfxUri = resolveSfxUri(
      settings.pack,
      this.ctx.extensionUri,
      settings.soundEnabled,
      settings.mutedPacks,
    );

    let orbitResult: OrbitWinResult | undefined;
    if (settings.orbitEnabled) {
      orbitResult = this.orbitStore.applyWin({
        dayKey: localDayKey(),
        size: toOrbitWinSize(kind, size, surface),
        kind,
        countsForStreak: countsForOrbitStreak(kind),
      });
      await this.orbitStore.save(orbitResult.state);
    }

    const streakDays = orbitResult?.state.streakDays ?? meta?.streak;
    const streakForHost =
      streakDays !== undefined && streakDays > 1 ? streakDays : undefined;

    const showArgs: CelebrationShowArgs = {
      surface,
      pack: settings.pack,
      mode,
      loop: visual.loop,
      gif: visual.gif,
      caption: picked.line,
      subline: picked.subline,
      emoji: visual.emojis.hero,
      orbitEmojis: visual.emojis.orbit,
      tint: packDef.tint,
      reduceMotion,
      dataReduceAuto,
      durationMs,
      extensionUri: this.ctx.extensionUri,
      sfxUri,
      focusSnapshot,
      streak: streakForHost,
      statusBarCompanion: Boolean(meta?.terminalNative && kind === 'tests'),
    };

    this.host.show(showArgs);

    if (orbitResult) {
      this.scheduleOrbitFollowUps(showArgs, orbitResult);
    }

    const extras = [
      visual.loop.id,
      visual.gif ? `gif:${visual.gif.id}` : undefined,
      picked.line,
      streakForHost ? `streak:${streakForHost}` : undefined,
      orbitResult ? `xp:+${orbitResult.xpGained}` : undefined,
    ]
      .filter(Boolean)
      .join(' · ');

    orbitalLogCelebrate(settings.pack, kind, surface, extras);

    this.celebrationIndex++;
  }

  /** Follow-ups use host.show only — never applyWin (avoids XP/streak loops). */
  private scheduleOrbitFollowUps(
    base: CelebrationShowArgs,
    result: OrbitWinResult,
  ): void {
    const mediumCopy = mediumFollowUpCopy({
      leveledUp: result.leveledUp,
      level: result.state.level,
      unlocked: result.unlocked,
    });
    const bigCopy = bigFollowUpCopy({
      milestone: result.milestone,
      missionCompleted: result.missionCompleted,
    });

    if (!mediumCopy && !bigCopy) {
      return;
    }

    const streak =
      result.state.streakDays > 1 ? result.state.streakDays : undefined;

    setTimeout(() => {
      if (mediumCopy) {
        this.host.show({
          ...base,
          surface: 'panel',
          mode: 'overlay',
          caption: mediumCopy.caption,
          subline: mediumCopy.subline,
          streak,
          statusBarCompanion: false,
          durationMs: CELEBRATION_DURATION_MS.overlay,
        });
      }
      if (bigCopy) {
        const delay = mediumCopy ? CelebrationEngine.FOLLOW_UP_DELAY_MS : 0;
        const showBig = () => {
          this.host.show({
            ...base,
            surface: 'overlay',
            mode: 'overlay',
            caption: bigCopy.caption,
            subline: bigCopy.subline,
            streak,
            statusBarCompanion: false,
            durationMs: CELEBRATION_DURATION_MS.overlay,
          });
        };
        if (delay > 0) {
          setTimeout(showBig, delay);
        } else {
          showBig();
        }
      }
    }, CelebrationEngine.FOLLOW_UP_DELAY_MS);
  }
}
