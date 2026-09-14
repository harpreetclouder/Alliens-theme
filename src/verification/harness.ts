import * as vscode from 'vscode';
import type { CelebrationEngine } from '../celebrations/engine';
import { readSettings } from '../config/settings';
import { orbitalLog, showOrbitalOutput } from '../util/log';
import {
  formatVerifySummary,
  type VerifyScenarioId,
  type VerifyScenarioResult,
} from './summary';

export type { VerifyScenarioId, VerifyScenarioResult } from './summary';
export { formatVerifySummary } from './summary';

function checkSettings(): VerifyScenarioResult {
  const s = readSettings(() => vscode.workspace.getConfiguration('orbital'));
  const gaps: string[] = [];
  if (!s.celebrationsEnabled) {
    gaps.push('celebrations.enabled=false');
  }
  if (!s.triggers.commit) {
    gaps.push('triggers.commit=false');
  }
  if (!s.triggers.tests) {
    gaps.push('triggers.tests=false');
  }
  if (!s.orbitEnabled) {
    gaps.push('orbit.enabled=false (level crumb hidden)');
  }
  if (!s.giphySdkKey) {
    gaps.push('giphy.sdkKey empty (local GIFs only)');
  }
  const ok = s.celebrationsEnabled && s.triggers.commit;
  return {
    id: 'settings',
    ok,
    detail: ok
      ? `pack=${s.pack} · intensity=${s.intensity} · display=${s.display}${gaps.length ? ` · notes: ${gaps.join(', ')}` : ''}`
      : `blocking: ${gaps.join(', ')}`,
  };
}

function checkGitWire(): VerifyScenarioResult {
  const gitExt = vscode.extensions.getExtension('vscode.git');
  if (!gitExt) {
    return { id: 'git-wire', ok: false, detail: 'vscode.git extension missing' };
  }
  if (!gitExt.isActive) {
    return { id: 'git-wire', ok: false, detail: 'vscode.git not active yet' };
  }
  try {
    const api = (gitExt.exports as { getAPI(v: number): { repositories: unknown[] } }).getAPI(1);
    const n = api.repositories?.length ?? 0;
    return {
      id: 'git-wire',
      ok: n > 0,
      detail: n > 0 ? `${n} repo(s) open` : 'no git repos open in this window',
    };
  } catch (err) {
    return { id: 'git-wire', ok: false, detail: String(err) };
  }
}

/**
 * Live verification harness — runs inside the extension so agents/users
 * can confirm celebrations without guessing settings.
 */
export async function runVerificationHarness(
  engine: CelebrationEngine,
  opts: { playVisuals?: boolean } = {},
): Promise<VerifyScenarioResult[]> {
  showOrbitalOutput();
  const playVisuals = opts.playVisuals !== false;
  const results: VerifyScenarioResult[] = [];

  orbitalLog('Verify harness', 'starting');

  results.push(checkSettings());
  results.push(checkGitWire());

  if (playVisuals) {
    try {
      engine.preview();
      results.push({
        id: 'preview',
        ok: true,
        detail: 'preview celebration fired (watch overlay)',
      });
      await sleep(1200);
      engine.handle('commit', { returnFocus: 'none' });
      results.push({
        id: 'commit-preview',
        ok: true,
        detail: 'commit celebration path fired (same as SCM win)',
      });
    } catch (err) {
      results.push({
        id: 'preview',
        ok: false,
        detail: String(err),
      });
    }
  } else {
    results.push({
      id: 'preview',
      ok: true,
      detail: 'skipped visuals (dry run)',
    });
    results.push({
      id: 'commit-preview',
      ok: true,
      detail: 'skipped visuals (dry run)',
    });
  }

  const s = readSettings(() => vscode.workspace.getConfiguration('orbital'));
  results.push({
    id: 'orbit-crumb',
    ok: s.orbitEnabled,
    detail: s.orbitEnabled
      ? 'orbit.enabled=true — status bar should show $(rocket) L·🔥'
      : 'orbit.enabled=false — enable for level crumb',
  });

  for (const r of results) {
    orbitalLog(`Verify · ${r.id}`, `${r.ok ? 'PASS' : 'FAIL'} — ${r.detail}`);
  }

  const failed = results.filter((r) => !r.ok).length;
  orbitalLog(
    'Verify harness done',
    `${results.length - failed}/${results.length} passed`,
  );

  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
