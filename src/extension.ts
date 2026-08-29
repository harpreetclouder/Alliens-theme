import * as vscode from 'vscode';
import { CelebrationEngine } from './celebrations/engine';
import { CelebrationHost } from './celebrations/host';

export function activate(context: vscode.ExtensionContext): void {
  const host = new CelebrationHost(vscode);
  const engine = new CelebrationEngine(context, host);
  context.subscriptions.push({ dispose: () => engine.dispose() });
}

export function deactivate(): void {}
