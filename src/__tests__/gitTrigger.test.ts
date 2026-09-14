import { describe, expect, it } from 'vitest';
import {
  isCommitOperationKind,
  parseCommitShaFromReflogLine,
} from '../triggers/gitCommitDetect';
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

describe('parseCommitShaFromReflogLine', () => {
  const sha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const old = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  it('accepts commit and amend lines', () => {
    expect(
      parseCommitShaFromReflogLine(
        `${old} ${sha} Ada <a@b.c> 1 +0000\tcommit: ship it`,
      ),
    ).toBe(sha);
    expect(
      parseCommitShaFromReflogLine(
        `${old} ${sha} Ada <a@b.c> 1 +0000\tcommit (amend): fix typo`,
      ),
    ).toBe(sha);
  });

  it('rejects checkout/pull/reset', () => {
    expect(
      parseCommitShaFromReflogLine(
        `${old} ${sha} Ada <a@b.c> 1 +0000\tcheckout: moving from main to dev`,
      ),
    ).toBeUndefined();
    expect(
      parseCommitShaFromReflogLine(
        `${old} ${sha} Ada <a@b.c> 1 +0000\tpull: Fast-forward`,
      ),
    ).toBeUndefined();
    expect(
      parseCommitShaFromReflogLine(
        `${old} ${sha} Ada <a@b.c> 1 +0000\treset: moving to HEAD~1`,
      ),
    ).toBeUndefined();
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
