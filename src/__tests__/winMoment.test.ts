import { describe, expect, it } from 'vitest';
import { decideWinMoment, SMALL_TASK_GAP_MS } from '../brain/winMoment';
import { isCompletedChoreCommand, isGenericCompletedTask } from '../triggers/taskSignals';

const base = {
  size: 'small' as const,
  typing: false,
  quietMode: false,
  celebrationsEnabled: true,
  intensity: 'normal' as const,
  nowMs: 100_000,
  recent: [] as { kind: 'task'; atMs: number }[],
};

describe('decideWinMoment', () => {
  it('gives a commit a full celebration when the user is not typing', () => {
    const d = decideWinMoment({ ...base, kind: 'commit' });
    expect(d.show).toBe(true);
    expect(d.forceSurface).toBeUndefined();
  });

  it('whispers a commit while typing instead of opening an overlay', () => {
    const d = decideWinMoment({ ...base, kind: 'push', typing: true });
    expect(d.show).toBe(true);
    expect(d.forceSurface).toBe('statusbar');
  });

  it('opens a full beat for the first finished chore after a pause', () => {
    const d = decideWinMoment({ ...base, kind: 'task' });
    expect(d.show).toBe(true);
    expect(d.forceSurface).toBe('overlay');
  });

  it('whispers the next chore and skips a burst of the same chore', () => {
    const recent = [{ kind: 'task' as const, atMs: base.nowMs - 30_000 }];
    const whisper = decideWinMoment({ ...base, kind: 'task', recent });
    expect(whisper.forceSurface).toBe('statusbar');

    const burst = decideWinMoment({
      ...base,
      kind: 'task',
      recent: [{ kind: 'task', atMs: base.nowMs - SMALL_TASK_GAP_MS + 1 }],
    });
    expect(burst.show).toBe(false);
  });

  it('lets a different chore through while the previous kind is in its gap', () => {
    const d = decideWinMoment({
      ...base,
      kind: 'save',
      recent: [{ kind: 'task', atMs: base.nowMs - 1000 }],
    });
    expect(d.show).toBe(true);
    expect(d.forceSurface).toBe('statusbar');
  });

  it('keeps quiet mode to a whisper and only for spotlight wins', () => {
    expect(decideWinMoment({ ...base, kind: 'build', size: 'big', quietMode: true }).forceSurface).toBe(
      'statusbar',
    );
    expect(decideWinMoment({ ...base, kind: 'task', quietMode: true }).show).toBe(false);
  });
});

describe('day-to-day task signals', () => {
  it('treats lint and format as finished chores', () => {
    expect(isCompletedChoreCommand('npm run lint')).toBe(true);
    expect(isCompletedChoreCommand('eslint src')).toBe(true);
    expect(isCompletedChoreCommand('npm test')).toBe(false);
    expect(isCompletedChoreCommand('npm run build')).toBe(false);
    expect(isCompletedChoreCommand('git push origin main')).toBe(false);
    expect(isCompletedChoreCommand('git status')).toBe(false);
  });

  it('celebrates generic tasks and leaves test and build names to their triggers', () => {
    expect(isGenericCompletedTask('lint')).toBe(true);
    expect(isGenericCompletedTask('Generate icons')).toBe(true);
    expect(isGenericCompletedTask('vitest')).toBe(false);
    expect(isGenericCompletedTask('build')).toBe(false);
  });
});
