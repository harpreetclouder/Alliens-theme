import * as path from 'node:path';
import * as vscode from 'vscode';
import { resolveSfxUri } from '../audio/sfxPlayer';
import { readSettings, type Intensity } from '../config/settings';
import {
  bigFollowUpCopy,
  mediumFollowUpCopy,
} from '../orbit/copy';
import { orbitFollowUpPresentation } from '../orbit/followUp';
import { OrbitStore, type OrbitWinResult } from '../orbit/store';
import {
  countsForOrbitStreak,
  localDayKey,
  toOrbitWinSize,
} from '../orbit/winMapping';
import { getPack } from '../packs/registry';
import { pickCaption } from './captions';
import { classifyKind, resolveDisplay } from './classifier';
import { pickJoyGif } from './contentBrain';
import { ContentLibrary } from './contentLibrary';
import { CELEBRATION_DURATION_MS } from './durations';
import { CelebrationHost, type CelebrationShowArgs } from './host';
import { capturePanelFocus, PanelReturnFocus } from './panelFocus';
import { getRegionDef, loadRegionsFile, resolveRegion } from './region';
import { resolveSurface } from './surface';
import { CelebrationThrottle } from './throttle';
import { WinKind } from './types';
import { pickCelebrationVisual } from './visuals';
import { orbitalLog, orbitalLogCelebrate, orbitalLogSkip } from '../util/log';

export interface CelebrationMeta {
  fullSuite?: boolean;
  returnFocus?: PanelReturnFocus;
  terminalNative?: boolean;
  streak?: number;
}

function loadLibrary(extensionUri: vscode.Uri): ContentLibrary {
  const file = vscode.Uri.joinPath(extensionUri, 'media', 'content', 'bites.json');
  return ContentLibrary.loadFromFile(file.fsPath);
}

export class CelebrationEngine {
  private readonly throttle = new CelebrationThrottle();
  private celebrationIndex = 0;
  private readonly library: ContentLibrary;
  /** Avoid repeating the same joke for the last N celebrations. */
  private readonly recentBiteIds: string[] = [];
  private readonly recentGifIds: string[] = [];
  private readonly followUpTimers: ReturnType<typeof setTimeout>[] = [];
  private static readonly RECENT_WINDOW = 12;
  private static readonly GIF_WINDOW = 16;
  private static readonly FOLLOW_UP_DELAY_MS = 1400;

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly host: CelebrationHost,
    private readonly orbitStore: OrbitStore,
  ) {
    this.library = loadLibrary(ctx.extensionUri);
  }

  handle(kind: WinKind, meta?: CelebrationMeta): void {
    void this.showCelebration(kind, meta, kind === 'preview');
  }

  preview(): void {
    void this.showCelebration('preview', { returnFocus: 'none' }, true);
  }

  dispose(): void {
    for (const timer of this.followUpTimers) {
      clearTimeout(timer);
    }
    this.followUpTimers.length = 0;
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
    const exclude = new Set(this.recentBiteIds);
    const picked = pickCaption(kind, settings.pack, Math.random, this.library, exclude);
    if (picked.biteId) {
      this.recentBiteIds.push(picked.biteId);
      while (this.recentBiteIds.length > CelebrationEngine.RECENT_WINDOW) {
        this.recentBiteIds.shift();
      }
    }
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
    const visual = pickCelebrationVisual(
      settings.pack,
      mode,
      Math.random,
      surface === 'panel' || surface === 'overlay',
    );

    const regionsPath = path.join(this.ctx.extensionUri.fsPath, 'media', 'content', 'regions.json');
    const regionsData = loadRegionsFile(regionsPath);
    const language = vscode.env.language || 'en';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const region = resolveRegion({
      language,
      timeZone,
      override: settings.joyRegion,
      data: regionsData,
    });
    const regionDef = getRegionDef(region, regionsData);

    let gif = visual.gif;
    let regionId = region;
    let regionLabel = regionDef.label;
    let gifSource: 'local' | 'giphy' = 'local';
    let brainDetail: string | undefined;
    if (surface === 'overlay' || surface === 'panel') {
      const brain = await Promise.race([
        pickJoyGif({
          pack: settings.pack,
          kind,
          language,
          timeZone,
          regionOverride: settings.joyRegion,
          giphySdkKey: settings.giphySdkKey,
          regionsPath,
          giphyCacheDir: path.join(this.ctx.globalStorageUri.fsPath, 'giphy-cache'),
          recentGifIds: this.recentGifIds,
        }),
        new Promise<Awaited<ReturnType<typeof pickJoyGif>>>((resolve) => {
          setTimeout(
            () =>
              resolve({
                gif: visual.gif,
                region,
                source: 'local-pack',
                detail: 'giphy budget exceeded → local',
              }),
            1200,
          );
        }),
      ]);
      brainDetail = brain.detail;
      if (brain.gif) {
        gif = brain.gif;
        gifSource = brain.source === 'giphy' ? 'giphy' : 'local';
        this.recentGifIds.push(brain.gif.id);
        while (this.recentGifIds.length > CelebrationEngine.GIF_WINDOW) {
          this.recentGifIds.shift();
        }
      }
      regionId = brain.region;
      regionLabel = getRegionDef(brain.region, regionsData).label;
    }

    const focusSnapshot = capturePanelFocus(meta?.returnFocus);

    const reduceMotion = settings.reduceMotion === 'always';
    const dataReduceAuto = settings.reduceMotion === 'auto';
    const useCollage = surface === 'overlay' || surface === 'panel';
    const durationMs = useCollage
      ? CELEBRATION_DURATION_MS.scene
      : mode === 'toast'
        ? CELEBRATION_DURATION_MS.toast
        : CELEBRATION_DURATION_MS.overlay;

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
        regionId,
      });
      await this.orbitStore.save();
      this.host.updateOrbitCrumb(
        orbitResult.state.level,
        orbitResult.state.streakDays,
      );
    }

    const streakDays = orbitResult?.state.streakDays ?? meta?.streak;
    const streakForHost =
      streakDays !== undefined && streakDays > 1 ? streakDays : undefined;

    const showArgs: CelebrationShowArgs = {
      surface,
      pack: settings.pack,
      mode,
      loop: visual.loop,
      gif,
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
      animFlavor: picked.anim,
      tone: picked.tone,
      regionId,
      regionLabel,
      giphyAttribution: gifSource === 'giphy',
    };

    this.host.show(showArgs);

    if (orbitResult) {
      this.scheduleOrbitFollowUps(showArgs, orbitResult, settings.intensity);
    }

    const extras = [
      visual.loop.id,
      gif ? `gif:${gif.id}` : undefined,
      `region:${regionId}`,
      gifSource === 'giphy' ? 'src:giphy' : 'src:local',
      picked.source === 'library' ? `bite:${picked.biteId}` : 'pack-line',
      `anim:${picked.anim}`,
      picked.line,
      streakForHost ? `streak:${streakForHost}` : undefined,
      orbitResult ? `xp:+${orbitResult.xpGained}` : undefined,
    ]
      .filter(Boolean)
      .join(' · ');

    orbitalLogCelebrate(settings.pack, kind, surface, extras);
    if (surface === 'overlay' || surface === 'panel') {
      const keyOn = Boolean(settings.giphySdkKey?.trim());
      orbitalLog(
        'Joy brain',
        `key=${keyOn ? 'yes' : 'no'} · ${gifSource}${brainDetail ? ` · ${brainDetail}` : ''}`,
      );
    }

    this.celebrationIndex++;
  }

  /**
   * Follow-ups call host.show only — never applyWin again (avoids XP/streak loops).
   * Chill intensity uses statusbar only (no panel/overlay visual).
   */
  private scheduleOrbitFollowUps(
    base: CelebrationShowArgs,
    result: OrbitWinResult,
    intensity: Intensity,
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

    const schedule = (fn: () => void, ms: number) => {
      const timer = setTimeout(() => {
        const idx = this.followUpTimers.indexOf(timer);
        if (idx >= 0) {
          this.followUpTimers.splice(idx, 1);
        }
        fn();
      }, ms);
      this.followUpTimers.push(timer);
    };

    schedule(() => {
      if (mediumCopy) {
        const pres = orbitFollowUpPresentation(intensity, 'medium');
        this.host.show({
          ...base,
          ...pres,
          caption: mediumCopy.caption,
          subline: mediumCopy.subline,
          streak,
          statusBarCompanion: false,
        });
      }
      if (bigCopy) {
        const delay = mediumCopy ? CelebrationEngine.FOLLOW_UP_DELAY_MS : 0;
        const showBig = () => {
          const pres = orbitFollowUpPresentation(intensity, 'big');
          this.host.show({
            ...base,
            ...pres,
            caption: bigCopy.caption,
            subline: bigCopy.subline,
            streak,
            statusBarCompanion: false,
          });
        };
        if (delay > 0) {
          schedule(showBig, delay);
        } else {
          showBig();
        }
      }
    }, CelebrationEngine.FOLLOW_UP_DELAY_MS);
  }
}
