import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';
import { orbitalLog } from '../util/log';
import { registerTerminalTestTrigger } from './terminalTestTrigger';

const TEST_NAME_RE =
  /test|jest|vitest|pytest|mocha|phpunit|npm.*test|pnpm.*test|yarn test|run tests/i;
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
      const def = e.execution.task.definition as { command?: string; script?: string } | undefined;
      const label = `${name} ${def?.command ?? ''} ${def?.script ?? ''}`;
      if (!TEST_NAME_RE.test(label)) {
        return;
      }

      const fullSuite = FULL_SUITE_RE.test(label);
      orbitalLog('Task test passed', `${name} → celebration`);
      engine.handle('tests', { fullSuite });
    }),
    ...registerTerminalTestTrigger(engine, getSettings),
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
