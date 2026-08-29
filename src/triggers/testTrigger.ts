import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';

const TEST_NAME_RE = /test|jest|vitest|pytest|mocha|phpunit/i;
const FULL_SUITE_RE = /suite|all|ci/i;

export function registerTestTrigger(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [
    vscode.tasks.onDidEndTaskProcess((e) => {
      const settings = getSettings();
      if (!settings.triggers.tests) {
        return;
      }
      if (e.exitCode !== 0) {
        return;
      }

      const name = e.execution.task.name;
      if (!TEST_NAME_RE.test(name)) {
        return;
      }

      const fullSuite = FULL_SUITE_RE.test(name);
      engine.handle('tests', { fullSuite });
    }),
  ];

  // vscode.tests exposes createTestController only — no global results listener in the public API.
  disposables.push(...tryRegisterTestsApiListener(engine, getSettings));

  return disposables;
}

function tryRegisterTestsApiListener(
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  const testsNamespace = vscode.tests as typeof vscode.tests & {
    onDidChangeTestResults?: vscode.Event<{ allPassed?: boolean; fullSuite?: boolean }>;
  };

  if (typeof testsNamespace.onDidChangeTestResults !== 'function') {
    return [];
  }

  return [
    testsNamespace.onDidChangeTestResults((results) => {
      const settings = getSettings();
      if (!settings.triggers.tests) {
        return;
      }
      if (!results.allPassed) {
        return;
      }

      engine.handle('tests', { fullSuite: results.fullSuite ?? false });
    }),
  ];
}
