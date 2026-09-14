import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';
import { registerAgentVerifyTrigger } from './agentVerifyTrigger';
import { registerBuildTrigger } from './buildTrigger';
import { registerDebugTrigger } from './debugTrigger';
import { registerGitTrigger } from './gitTrigger';
import { registerSaveTrigger } from './saveTrigger';
import { registerTestTrigger } from './testTrigger';
import { registerVitestSignalTrigger } from './vitestSignalTrigger';

export function registerTriggers(
  context: vscode.ExtensionContext,
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  const version = String(context.extension.packageJSON.version ?? '?');
  // Register agent verify + git before terminal hooks — a proposed-API throw
  // used to abort activate() and kill every celebration path.
  return [
    registerAgentVerifyTrigger(context, engine),
    ...registerGitTrigger(engine, getSettings, version),
    registerVitestSignalTrigger(engine, getSettings),
    ...registerTestTrigger(engine, getSettings),
    ...registerBuildTrigger(engine, getSettings),
    ...registerDebugTrigger(engine, getSettings),
    ...registerSaveTrigger(engine, getSettings),
  ];
}
