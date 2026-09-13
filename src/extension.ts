import * as vscode from 'vscode';
import { CelebrationEngine } from './celebrations/engine';
import { CelebrationHost } from './celebrations/host';
import { CELEBRATION_PANEL_VIEW_ID, CelebrationPanelProvider } from './celebrations/panelView';
import { registerCommands } from './commands/registerCommands';
import { readSettings } from './config/settings';
import { maybeDayStart } from './orbit/dayStart';
import { OrbitStore } from './orbit/store';
import { runFirstRunIfNeeded } from './onboarding/firstRun';
import { registerTriggers } from './triggers/registerTriggers';
import { orbitalLog, showOrbitalOutput } from './util/log';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  showOrbitalOutput();
  orbitalLog('Extension activated', `v${context.extension.packageJSON.version ?? '?'}`);

  const panelProvider = new CelebrationPanelProvider(context.extensionUri, vscode);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(CELEBRATION_PANEL_VIEW_ID, panelProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  const host = new CelebrationHost(vscode, panelProvider);
  const orbitStore = new OrbitStore(context.globalState);
  const engine = new CelebrationEngine(context, host, orbitStore);
  context.subscriptions.push({ dispose: () => engine.dispose() });

  const settings = readSettings(() => vscode.workspace.getConfiguration('orbital'));
  maybeDayStart(context, orbitStore, host, settings);

  // Commands first — preview must work even during onboarding
  context.subscriptions.push(...registerCommands(context, engine));

  const disposables = registerTriggers(context, engine, () =>
    readSettings(() => vscode.workspace.getConfiguration('orbital')),
  );
  context.subscriptions.push(...disposables);

  void runFirstRunIfNeeded(context);
}

export function deactivate(): void {}
