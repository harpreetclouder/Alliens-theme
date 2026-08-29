import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';

const BUILD_NAME_RE = /build|compile|webpack|vite build|tsc/i;

export function registerBuildTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  return [
    vscode.tasks.onDidEndTaskProcess((e) => {
      const settings = getSettings();
      if (!settings.triggers.build) {
        return;
      }
      if (e.exitCode !== 0) {
        return;
      }

      const name = e.execution.task.name;
      if (!BUILD_NAME_RE.test(name)) {
        return;
      }

      engine.handle('build');
    }),
  ];
}
