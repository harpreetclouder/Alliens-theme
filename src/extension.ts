import * as vscode from 'vscode';
import { CelebrationEngine } from './celebrations/engine';
import { CelebrationHost } from './celebrations/host';
import { registerCommands } from './commands/registerCommands';
import { runFirstRunIfNeeded } from './onboarding/firstRun';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const host = new CelebrationHost(vscode);
  const engine = new CelebrationEngine(context, host);
  context.subscriptions.push({ dispose: () => engine.dispose() });

  await runFirstRunIfNeeded(context);
  context.subscriptions.push(...registerCommands(context, engine));
}

export function deactivate(): void {}
