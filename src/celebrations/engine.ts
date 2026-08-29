import * as vscode from 'vscode';
import { resolveSfxUri } from '../audio/sfxPlayer';
import { readSettings } from '../config/settings';
import { getPack } from '../packs/registry';
import { PACK_EMOJI } from './emojis';
import { captionFor } from './captions';
import { classifyKind, resolveDisplay } from './classifier';
import { CelebrationHost } from './host';
import { pickLoop } from './picker';
import { CelebrationThrottle } from './throttle';
import { WinKind } from './types';
import { orbitalLog } from '../util/log';

export class CelebrationEngine {
  private readonly throttle = new CelebrationThrottle();
  private celebrationIndex = 0;

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly host: CelebrationHost,
  ) {}

  handle(kind: WinKind, meta?: { fullSuite?: boolean }): void {
    this.showCelebration(kind, meta, kind === 'preview');
  }

  preview(): void {
    this.showCelebration('preview', undefined, true);
  }

  dispose(): void {
    this.host.dispose();
  }

  private showCelebration(
    kind: WinKind,
    meta: { fullSuite?: boolean } | undefined,
    bypassThrottle: boolean,
  ): void {
    const settings = readSettings(() => vscode.workspace.getConfiguration('orbital'));

    if (!settings.celebrationsEnabled) {
      orbitalLog(`Celebration skipped (${kind}) — celebrations disabled`);
      return;
    }

    const size = classifyKind(kind, meta);

    if (!bypassThrottle && !this.throttle.allow({ kind, size })) {
      orbitalLog(`Celebration skipped (${kind}) — throttled`);
      return;
    }

    const mode = resolveDisplay(size, settings.intensity, this.celebrationIndex);
    const loop = pickLoop(settings.pack);
    const caption = captionFor(kind, settings.pack);
    const packDef = getPack(settings.pack);

    const reduceMotion = settings.reduceMotion === 'always';
    const dataReduceAuto = settings.reduceMotion === 'auto';
    const durationMs = mode === 'toast' ? 1500 : 2500;

    const sfxUri = resolveSfxUri(
      settings.pack,
      this.ctx.extensionUri,
      settings.soundEnabled,
      settings.mutedPacks,
    );

    this.host.show({
      mode,
      loop,
      caption,
      tint: packDef.tint,
      reduceMotion,
      dataReduceAuto,
      durationMs,
      extensionUri: this.ctx.extensionUri,
      sfxUri,
    });

    orbitalLog(`Celebration shown: ${settings.pack} · ${kind} · ${mode} · ${loop.id}`);

    if (mode === 'toast') {
      const emoji = PACK_EMOJI[settings.pack];
      void vscode.window.showInformationMessage(`${emoji} ${caption}`);
    }

    this.celebrationIndex++;
  }
}
