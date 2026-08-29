import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { OrbitalSettings } from '../config/settings';
import { registerBuildTrigger } from './buildTrigger';
import { registerDebugTrigger } from './debugTrigger';
import { registerGitTrigger } from './gitTrigger';
import { registerSaveTrigger } from './saveTrigger';
import { registerTestTrigger } from './testTrigger';

export function registerTriggers(
  _context: vscode.ExtensionContext,
  engine: CelebrationEngine,
  getSettings: () => OrbitalSettings,
): vscode.Disposable[] {
  return [
    ...registerTestTrigger(engine, getSettings),
    ...registerBuildTrigger(engine, getSettings),
    ...registerGitTrigger(engine, getSettings),
    ...registerDebugTrigger(engine, getSettings),
    ...registerSaveTrigger(engine, getSettings),
  ];
}
