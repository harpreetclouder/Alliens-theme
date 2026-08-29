import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as vscode from 'vscode';
import { getPack } from '../packs/registry';
import { PackId } from '../packs/types';

export function resolveSfxUri(
  pack: PackId,
  extensionUri: vscode.Uri,
  enabled: boolean,
  mutedPacks: PackId[],
): vscode.Uri | undefined {
  if (!enabled || mutedPacks.includes(pack)) return undefined;
  const file = getPack(pack).sfxFile;
  return vscode.Uri.joinPath(extensionUri, 'media', 'sfx', file);
}

/** Play pack SFX without opening a webview (afplay on macOS, webview fallback elsewhere). */
export function playSfxFile(
  sfxUri: vscode.Uri,
  vscodeApi: typeof vscode = vscode,
): void {
  const filePath = sfxUri.fsPath;
  if (!fs.existsSync(filePath)) {
    return;
  }

  if (process.platform === 'darwin') {
    const child = spawn('afplay', [filePath], { stdio: 'ignore', detached: true });
    child.unref();
    return;
  }

  if (process.platform === 'win32') {
    spawn(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `(New-Object Media.SoundPlayer '${filePath.replace(/'/g, "''")}').Play()`,
      ],
      { stdio: 'ignore', detached: true },
    ).unref();
    return;
  }

  playSfxWebview(sfxUri, vscodeApi);
}

function playSfxWebview(sfxUri: vscode.Uri, vscodeApi: typeof vscode): void {
  const panel = vscodeApi.window.createWebviewPanel(
    'orbital.sfx',
    'Orbital',
    { viewColumn: vscodeApi.ViewColumn.Active, preserveFocus: true },
    { enableScripts: true, localResourceRoots: [sfxUri.with({ path: sfxUri.path.replace(/\/[^/]+$/, '') })] },
  );

  const src = panel.webview.asWebviewUri(sfxUri).toString();
  panel.webview.html = `<!DOCTYPE html><html><body style="margin:0;padding:0;">
<audio autoplay src="${src}"></audio>
<script>
  const a = document.querySelector('audio');
  a.onended = () => window.close?.();
  a.onerror = () => setTimeout(() => { /* dispose via timeout */ }, 100);
</script></body></html>`;

  setTimeout(() => {
    panel.dispose();
  }, 8000);
}
