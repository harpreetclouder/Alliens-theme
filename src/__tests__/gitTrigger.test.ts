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

describe('push detection', () => {
  it('accepts Push operations and remote reflog messages', async () => {
    const { isPushOperationKind, isPushReflogMessage } = await import('../triggers/gitCommitDetect');
    expect(isPushOperationKind('Push')).toBe(true);
    expect(isPushOperationKind('PushFollowTags')).toBe(true);
    expect(isPushOperationKind('Pull')).toBe(false);
    expect(isPushReflogMessage('update by push')).toBe(true);
    expect(isPushReflogMessage('push: origin main')).toBe(true);
    expect(isPushReflogMessage('commit: ship it')).toBe(false);
    expect(isPushReflogMessage('pull: Fast-forward')).toBe(false);
  });

  it('accepts stash operations and stash reflog messages', async () => {
    const { isStashOperationKind, isStashReflogMessage, isStashShellCommand, isNewStashEntry } = await import('../triggers/gitCommitDetect');
    expect(isStashOperationKind('Stash')).toBe(true);
    expect(isStashOperationKind('StashDrop')).toBe(false);
    expect(isStashReflogMessage('WIP on main: ship it')).toBe(true);
    expect(isStashReflogMessage('commit: ship it')).toBe(false);
    expect(isStashShellCommand('git stash')).toBe(true);
    expect(isStashShellCommand('git stash drop')).toBe(false);
    expect(isStashShellCommand('git stash list')).toBe(false);
    expect(isNewStashEntry('1:aaaaaaa', '2:bbbbbbb')).toBe(true);
    expect(isNewStashEntry('2:bbbbbbb', '1:aaaaaaa')).toBe(false);
    expect(isNewStashEntry('1:aaaaaaa', '1:aaaaaaa')).toBe(false);
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

describe('agent verify IPC paths', () => {
  it('uses stable .vscode filenames', async () => {
    const { VERIFY_REQUEST_REL, VERIFY_RESULT_REL } = await import(
      '../verification/agentIpc'
    );
    expect(VERIFY_REQUEST_REL).toBe('.vscode/orbital-verify-request.json');
    expect(VERIFY_RESULT_REL).toBe('.vscode/orbital-verify-result.json');
  });
});
