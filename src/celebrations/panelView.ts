import * as vscode from 'vscode';
import {
  buildCelebrationHtml,
  buildIdlePanelHtml,
  CelebrationHtmlOpts,
} from './celebrationHtml';
import { EXIT_LEAD_MS } from './durations';
import { CelebrationShowArgs } from './host';
import { gifLocalResourceRoots, resolveGifWebviewUri } from './gifUri';
import { focusOrbitalView, restorePanelFocus, waitForView } from './panelFocus';
import { readSettings } from '../config/settings';
import { resolveIdleOrbit } from '../orbit/idleHud';
import type { OrbitStore } from '../orbit/store';
import { orbitalLog } from '../util/log';

const VIEW_ID = 'orbital.celebrationView';

export class CelebrationPanelProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;
  private resetTimer: ReturnType<typeof setTimeout> | undefined;
  private pending: CelebrationShowArgs | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly vscodeApi: typeof vscode,
    private readonly orbitStore?: OrbitStore,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
    };

    this.renderIdle(this.extensionUri);

    if (this.pending) {
      const args = this.pending;
      this.pending = undefined;
      void this.render(args);
    }
  }

  async show(args: CelebrationShowArgs): Promise<boolean> {
    if (!this.view) {
      this.pending = args;
      await focusOrbitalView(this.vscodeApi, VIEW_ID);
      const ready = await waitForView(() => this.view);
      if (!ready || !this.view) {
        orbitalLog('Panel view not ready', 'Orbital tab may need manual open once');
        return false;
      }
      if (this.pending) {
        const next = this.pending;
        this.pending = undefined;
        return this.render(next);
      }
    }
    return this.render(args);
  }

  dispose(): void {
    this.clearTimer();
    this.pending = undefined;
  }

  private async render(args: CelebrationShowArgs): Promise<boolean> {
    const view = this.view;
    if (!view) {
      return false;
    }

    try {
      this.clearTimer();

      view.webview.options = {
        enableScripts: true,
        localResourceRoots: gifLocalResourceRoots(args.extensionUri, args.gif, this.vscodeApi),
      };

      const cssUri = view.webview.asWebviewUri(
        vscode.Uri.joinPath(args.extensionUri, 'media', 'webview', 'celebration.css'),
      );

      const htmlOpts: CelebrationHtmlOpts = {
        cssUri: cssUri.toString(),
        mode: 'panel',
        loopClass: args.loop.cssClass,
        gifUri: resolveGifWebviewUri(view.webview, args.extensionUri, args.gif, this.vscodeApi),
        caption: args.caption,
        subline: args.subline,
        emoji: args.emoji,
        orbitEmojis: args.orbitEmojis,
        tint: args.tint,
        reduceMotion: args.reduceMotion,
        dataReduceAuto: args.dataReduceAuto,
        durationMs: args.durationMs,
        exitLeadMs: EXIT_LEAD_MS,
        cspSource: view.webview.cspSource,
        sfxUri: args.sfxUri
          ? view.webview.asWebviewUri(args.sfxUri).toString()
          : undefined,
        animFlavor: args.animFlavor,
        tone: args.tone,
        collage: true,
        pack: args.pack,
        surface: 'panel',
        regionId: args.regionId,
        regionLabel: args.regionLabel,
        giphyAttribution: args.giphyAttribution,
      };

      view.webview.html = buildCelebrationHtml(htmlOpts);
      view.show?.(true);
      await focusOrbitalView(this.vscodeApi, VIEW_ID);

      orbitalLog('Panel celebration rendered', args.caption);

      this.resetTimer = setTimeout(() => {
        void this.finishCelebration(args);
      }, args.durationMs);

      return true;
    } catch (err) {
      orbitalLog('Panel render failed', String(err));
      return false;
    }
  }

  private async finishCelebration(args: CelebrationShowArgs): Promise<void> {
    if (this.view) {
      await new Promise((r) => setTimeout(r, EXIT_LEAD_MS));
      this.renderIdle(args.extensionUri);
    }

    await restorePanelFocus(this.vscodeApi, args.focusSnapshot);
  }

  private renderIdle(extensionUri: vscode.Uri): void {
    if (!this.view) {
      return;
    }
    const idleCss = this.view.webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'webview', 'celebration.css'),
    );
    const settings = readSettings(() =>
      this.vscodeApi.workspace.getConfiguration('orbital'),
    );
    const orbit = resolveIdleOrbit(settings.orbitEnabled, this.orbitStore);
    this.view.webview.html = buildIdlePanelHtml(
      this.view.webview.cspSource,
      idleCss.toString(),
      orbit,
    );
  }

  private clearTimer(): void {
    if (this.resetTimer !== undefined) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }
}

export { VIEW_ID as CELEBRATION_PANEL_VIEW_ID };
