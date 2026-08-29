import * as vscode from 'vscode';
import { LoopDef } from './loops';

export interface CelebrationShowArgs {
  mode: 'toast' | 'overlay';
  loop: LoopDef;
  caption: string;
  tint: string;
  reduceMotion: boolean;
  durationMs: number;
  extensionUri: vscode.Uri;
}

export class CelebrationHost {
  private panel: vscode.WebviewPanel | undefined;
  private disposeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private vscodeApi: typeof vscode) {}

  show(args: CelebrationShowArgs): void {
    this.dispose();

    const { mode, loop, caption, tint, reduceMotion, durationMs, extensionUri } = args;
    const vscode = this.vscodeApi;

    const panel = vscode.window.createWebviewPanel(
      'orbital.celebration',
      'Orbital',
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
      {
        enableScripts: false,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      },
    );

    const cssUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'webview', 'celebration.css'),
    );

    panel.webview.html = buildHtml({
      cssUri: cssUri.toString(),
      mode,
      loopClass: loop.cssClass,
      caption,
      tint,
      reduceMotion,
      cspSource: panel.webview.cspSource,
    });

    this.panel = panel;
    this.disposeTimer = setTimeout(() => this.dispose(), durationMs);

    panel.onDidDispose(() => {
      this.clearTimer();
      if (this.panel === panel) {
        this.panel = undefined;
      }
    });
  }

  dispose(): void {
    this.clearTimer();
    if (this.panel) {
      const active = this.panel;
      this.panel = undefined;
      active.dispose();
    }
  }

  private clearTimer(): void {
    if (this.disposeTimer !== undefined) {
      clearTimeout(this.disposeTimer);
      this.disposeTimer = undefined;
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(opts: {
  cssUri: string;
  mode: 'toast' | 'overlay';
  loopClass: string;
  caption: string;
  tint: string;
  reduceMotion: boolean;
  cspSource: string;
}): string {
  const modeClass = opts.mode === 'toast' ? 'mode-toast' : 'mode-overlay';
  const motionClass = opts.reduceMotion ? 'reduce-motion' : '';
  const bodyClasses = [modeClass, motionClass].filter(Boolean).join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${opts.cspSource} 'unsafe-inline'; media-src ${opts.cspSource};">
  <link rel="stylesheet" href="${opts.cssUri}">
  <style>body { --tint: ${opts.tint}; }</style>
</head>
<body class="${bodyClasses}">
  <div class="celebration">
    <div class="loop ${opts.loopClass}" aria-hidden="true"></div>
    <p class="caption">${escapeHtml(opts.caption)}</p>
  </div>
</body>
</html>`;
}
