export type VerifyScenarioId =
  | 'settings'
  | 'git-wire'
  | 'preview'
  | 'commit-preview'
  | 'orbit-crumb';

export interface VerifyScenarioResult {
  id: VerifyScenarioId;
  ok: boolean;
  detail: string;
}

export function formatVerifySummary(results: VerifyScenarioResult[]): string {
  const lines = results.map((r) => `${r.ok ? '✓' : '✗'} ${r.id}: ${r.detail}`);
  const failed = results.filter((r) => !r.ok).length;
  return `Orbital verify: ${results.length - failed}/${results.length} passed\n${lines.join('\n')}`;
}
