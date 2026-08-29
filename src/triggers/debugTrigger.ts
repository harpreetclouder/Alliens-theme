import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';

export function registerDebugTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  return [
    vscode.debug.onDidTerminateDebugSession(() => {
      const settings = getSettings();
      if (!settings.triggers.debug) {
        return;
      }
      // Best-effort v1: fires on any debug session end, not only successful runs.
      engine.handle('debug');
    }),
  ];
}
