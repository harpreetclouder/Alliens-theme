import { describe, expect, it } from 'vitest';
import { isCommitOperationKind } from '../triggers/gitCommitDetect';
import { formatVerifySummary, type VerifyScenarioResult } from '../verification/summary';

describe('isCommitOperationKind', () => {
  it('accepts Commit and variants', () => {
    expect(isCommitOperationKind('Commit')).toBe(true);
    expect(isCommitOperationKind('commit')).toBe(true);
    expect(isCommitOperationKind('CommitStaged')).toBe(true);
    expect(isCommitOperationKind('CommitAll')).toBe(true);
  });

  it('rejects non-commit ops', () => {
    expect(isCommitOperationKind('Push')).toBe(false);
    expect(isCommitOperationKind('Pull')).toBe(false);
    expect(isCommitOperationKind(undefined)).toBe(false);
  });
});

describe('formatVerifySummary', () => {
  it('formats pass/fail lines', () => {
    const results: VerifyScenarioResult[] = [
      { id: 'settings', ok: true, detail: 'ok' },
      { id: 'git-wire', ok: false, detail: 'no repos' },
    ];
    const text = formatVerifySummary(results);
    expect(text).toContain('1/2 passed');
    expect(text).toContain('✓ settings');
    expect(text).toContain('✗ git-wire');
  });
});
