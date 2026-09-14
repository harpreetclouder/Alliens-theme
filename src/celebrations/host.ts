import * as vscode from 'vscode';
import { playSfxFile } from '../audio/sfxPlayer';
import { PackId } from '../packs/types';
import { buildCelebrationHtml, CelebrationHtmlOpts } from './celebrationHtml';
import { CelebrationPanelProvider } from './panelView';
import { EXIT_LEAD_MS } from './durations';
import { GifDef } from './gifs';
import { gifLocalResourceRoots, resolveGifWebviewUri } from './gifUri';
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
  animFlavor?: string;
  tone?: string;
  regionId?: string;
  regionLabel?: string;
  /** Show Powered by GIPHY when live SDK GIF is used (ToS). */
  giphyAttribution?: boolean;
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

  /** Persistent L{n} · 🔥{streak} when orbit is enabled. */
  updateOrbitCrumb(level: number, streakDays: number): void {
    this.statusBar.setOrbitCrumb(level, streakDays);
  }

  clearOrbitCrumb(): void {
    this.statusBar.clearOrbitCrumb();
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

    const { loop, gif, caption, subline, emoji, orbitEmojis, tint, reduceMotion, dataReduceAuto, durationMs, extensionUri, sfxUri } =
      args;
    const vscode = this.vscodeApi;

    const panel = vscode.window.createWebviewPanel(
      'orbital.celebration',
      'Orbital',
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: false,
        localResourceRoots: gifLocalResourceRoots(extensionUri, gif, vscode),
      },
    );

    const cssUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'webview', 'celebration.css'),
    );

    const htmlOpts: CelebrationHtmlOpts = {
      cssUri: cssUri.toString(),
      mode: 'overlay',
      loopClass: loop.cssClass,
      gifUri: resolveGifWebviewUri(panel.webview, extensionUri, gif, vscode),
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
      animFlavor: args.animFlavor,
      tone: args.tone,
      collage: true,
      pack: args.pack,
      surface: 'overlay',
      regionId: args.regionId,
      regionLabel: args.regionLabel,
      giphyAttribution: args.giphyAttribution,
    };

    panel.webview.html = buildCelebrationHtml(htmlOpts);
    // Keep editor/terminal focused — don't yank user into an "Orbital" tab.
    panel.reveal(vscode.ViewColumn.Active, true);
    void restorePanelFocus(this.vscodeApi, args.focusSnapshot);
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
