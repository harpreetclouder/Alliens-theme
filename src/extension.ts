import * as vscode from 'vscode';
import { CelebrationEngine } from './celebrations/engine';
import { CelebrationHost } from './celebrations/host';
import { ContentLibrary } from './celebrations/contentLibrary';
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

  const orbitStore = new OrbitStore(context.globalState);
  const panelProvider = new CelebrationPanelProvider(context.extensionUri, vscode, orbitStore);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(CELEBRATION_PANEL_VIEW_ID, panelProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  const host = new CelebrationHost(vscode, panelProvider);
  const engine = new CelebrationEngine(context, host, orbitStore);
  context.subscriptions.push({ dispose: () => engine.dispose() });
  orbitalLog(
    'Content library loaded',
    `${ContentLibrary.loadFromFile(
      vscode.Uri.joinPath(context.extensionUri, 'media', 'content', 'bites.json').fsPath,
    ).size} bites`,
  );

  const settings = readSettings(() => vscode.workspace.getConfiguration('orbital'));
  const refreshOrbitCrumb = (): void => {
    const s = readSettings(() => vscode.workspace.getConfiguration('orbital'));
    if (s.orbitEnabled) {
      const orbit = orbitStore.load();
      host.updateOrbitCrumb(orbit.level, orbit.streakDays);
      orbitalLog('Orbit crumb', `L${orbit.level} · streak ${orbit.streakDays}`);
    } else {
      host.clearOrbitCrumb();
      orbitalLog('Orbit crumb', 'hidden (orbit.enabled=false)');
    }
  };
  refreshOrbitCrumb();
  maybeDayStart(context, orbitStore, host, settings);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('orbital.orbit.enabled')) {
        refreshOrbitCrumb();
      }
    }),
  );

  // Commands first — preview must work even during onboarding
  context.subscriptions.push(...registerCommands(context, engine));

  const disposables = registerTriggers(context, engine, () =>
    readSettings(() => vscode.workspace.getConfiguration('orbital')),
  );
  context.subscriptions.push(...disposables);

  void runFirstRunIfNeeded(context);
}

export function deactivate(): void {}
