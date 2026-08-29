import * as vscode from 'vscode';
import { playSfxFile } from '../audio/sfxPlayer';
import { PackId } from '../packs/types';
import { buildCelebrationHtml, CelebrationHtmlOpts } from './celebrationHtml';
import { CelebrationPanelProvider } from './panelView';
import { EXIT_LEAD_MS } from './durations';
import { GifDef } from './gifs';
import { LoopDef } from './loops';
import { PanelFocusSnapshot, restorePanelFocus } from './panelFocus';
import { CelebrationSurface } from './surface';
import { StatusBarCelebration } from './statusBar';
import { orbitalLog } from '../util/log';

export type { CelebrationSurface };

export interface CelebrationShowArgs {
  surface: CelebrationSurface;
  pack: PackId;
  mode: 'toast' | 'overlay';
  loop: LoopDef;
  gif?: GifDef;
  caption: string;
  subline?: string;
  emoji: string;
  orbitEmojis?: [string, string, string];
  tint: string;
  reduceMotion: boolean;
  dataReduceAuto?: boolean;
  durationMs: number;
  extensionUri: vscode.Uri;
  sfxUri?: vscode.Uri;
  focusSnapshot: PanelFocusSnapshot;
  streak?: number;
  /** Brief status-bar streak hint after in-terminal wins. */
  statusBarCompanion?: boolean;
}

export class CelebrationHost {
  private panel: vscode.WebviewPanel | undefined;
  private disposeTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly statusBar: StatusBarCelebration;

  constructor(
    private vscodeApi: typeof vscode,
    private readonly panelProvider: CelebrationPanelProvider,
  ) {
    this.statusBar = new StatusBarCelebration(vscodeApi);
  }

  show(args: CelebrationShowArgs): void {
    if (args.surface === 'terminal') {
      if (args.sfxUri) {
        playSfxFile(args.sfxUri, this.vscodeApi);
      }
      if (args.statusBarCompanion) {
        this.statusBar.show({
          emoji: args.emoji,
          caption: args.caption,
          subline: args.subline,
          streak: args.streak,
          durationMs: 3500,
        });
      }
      orbitalLog('Celebration in terminal', args.caption);
      return;
    }

    if (args.surface === 'statusbar') {
      this.statusBar.show({
        emoji: args.emoji,
        caption: args.caption,
        subline: args.subline,
        streak: args.streak,
        durationMs: args.mode === 'toast' ? 2800 : args.durationMs,
      });
      if (args.sfxUri) {
        playSfxFile(args.sfxUri, this.vscodeApi);
      }
      orbitalLog('Status bar celebration', args.caption);
      return;
    }

    if (args.surface === 'panel') {
      void this.panelProvider.show(args).then((ok) => {
        if (!ok) {
          orbitalLog('Falling back to overlay', args.caption);
          this.showOverlay({ ...args, mode: 'overlay' });
        }
      });
      return;
    }
    this.showOverlay(args);
  }

  private showOverlay(args: CelebrationShowArgs): void {
    this.disposeOverlay();

    const { mode, loop, gif, caption, subline, emoji, orbitEmojis, tint, reduceMotion, dataReduceAuto, durationMs, extensionUri, sfxUri } =
      args;
    const vscode = this.vscodeApi;

    const panel = vscode.window.createWebviewPanel(
      'orbital.celebration',
      'Orbital',
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      },
    );

    const cssUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'webview', 'celebration.css'),
    );

    const htmlOpts: CelebrationHtmlOpts = {
      cssUri: cssUri.toString(),
      mode,
      loopClass: loop.cssClass,
      gifUri: gif
        ? panel.webview
            .asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'gifs', ...gif.file.split('/')))
            .toString()
        : undefined,
      caption,
      subline,
      emoji,
      orbitEmojis,
      tint,
      reduceMotion,
      dataReduceAuto,
      durationMs,
      exitLeadMs: EXIT_LEAD_MS,
      cspSource: panel.webview.cspSource,
      sfxUri: sfxUri ? panel.webview.asWebviewUri(sfxUri).toString() : undefined,
    };

    panel.webview.html = buildCelebrationHtml(htmlOpts);
    panel.reveal(vscode.ViewColumn.Active, true);
    orbitalLog('Overlay celebration shown', caption);

    this.panel = panel;
    this.disposeTimer = setTimeout(() => {
      this.disposeOverlay();
      void restorePanelFocus(this.vscodeApi, args.focusSnapshot);
    }, durationMs);

    panel.onDidDispose(() => {
      this.clearOverlayTimer();
      if (this.panel === panel) {
        this.panel = undefined;
      }
    });
  }

  dispose(): void {
    this.disposeOverlay();
    this.panelProvider.dispose();
    this.statusBar.dispose();
  }

  private disposeOverlay(): void {
    this.clearOverlayTimer();
    if (this.panel) {
      const active = this.panel;
      this.panel = undefined;
      active.dispose();
    }
  }

  private clearOverlayTimer(): void {
    if (this.disposeTimer !== undefined) {
      clearTimeout(this.disposeTimer);
      this.disposeTimer = undefined;
    }
  }
}
