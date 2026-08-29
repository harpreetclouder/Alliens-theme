import * as vscode from 'vscode';
import { resolveSfxUri } from '../audio/sfxPlayer';
import { readSettings } from '../config/settings';
import { getPack } from '../packs/registry';
import { pickCaption } from './captions';
import { classifyKind, resolveDisplay } from './classifier';
import { CELEBRATION_DURATION_MS } from './durations';
import { CelebrationHost } from './host';
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

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly host: CelebrationHost,
  ) {}

  handle(kind: WinKind, meta?: CelebrationMeta): void {
    this.showCelebration(kind, meta, kind === 'preview');
  }

  preview(): void {
    this.showCelebration('preview', { returnFocus: 'none' }, true);
  }

  dispose(): void {
    this.host.dispose();
  }

  private showCelebration(
    kind: WinKind,
    meta: CelebrationMeta | undefined,
    bypassThrottle: boolean,
  ): void {
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

    this.host.show({
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
      streak: meta?.streak,
      statusBarCompanion: Boolean(meta?.terminalNative && kind === 'tests'),
    });

    const extras = [
      visual.loop.id,
      visual.gif ? `gif:${visual.gif.id}` : undefined,
      picked.line,
      meta?.streak && meta.streak > 1 ? `streak:${meta.streak}` : undefined,
    ]
      .filter(Boolean)
      .join(' · ');

    orbitalLogCelebrate(settings.pack, kind, surface, extras);

    this.celebrationIndex++;
  }
}
