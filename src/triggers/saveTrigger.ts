import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';

export function registerSaveTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  return [
    vscode.workspace.onDidSaveTextDocument(() => {
      const settings = getSettings();
      if (!settings.triggers.save) {
        return;
      }
      engine.handle('save');
    }),
  ];
}
