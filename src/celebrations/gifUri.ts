import * as path from 'node:path';
import * as vscode from 'vscode';
import { GifDef } from './gifs';

/** Resolve local pack GIF, cached Giphy file, or remote HTTPS URL for webview. */
export function resolveGifWebviewUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  gif: GifDef | undefined,
  vscodeApi: typeof vscode,
): string | undefined {
  if (!gif) {
    return undefined;
  }
  if (gif.absoluteFsPath) {
    return webview.asWebviewUri(vscodeApi.Uri.file(gif.absoluteFsPath)).toString();
  }
  if (gif.remoteUrl) {
    return gif.remoteUrl;
  }
  if (gif.file) {
    return webview
      .asWebviewUri(vscodeApi.Uri.joinPath(extensionUri, 'media', 'gifs', ...gif.file.split('/')))
      .toString();
  }
  return undefined;
}

export function gifLocalResourceRoots(
  extensionUri: vscode.Uri,
  gif: GifDef | undefined,
  vscodeApi: typeof vscode,
): vscode.Uri[] {
  const roots = [vscodeApi.Uri.joinPath(extensionUri, 'media')];
  if (gif?.absoluteFsPath) {
    roots.push(vscodeApi.Uri.file(path.dirname(gif.absoluteFsPath)));
  }
  return roots;
}
