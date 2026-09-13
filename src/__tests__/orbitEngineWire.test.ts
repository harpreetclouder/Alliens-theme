import { describe, expect, it } from 'vitest';
import {
  achievementsCaption,
  bigFollowUpCopy,
  levelUpCaption,
  mediumFollowUpCopy,
  milestoneCaption,
} from '../orbit/copy';
import {
  countsForOrbitStreak,
  localDayKey,
  toOrbitWinSize,
} from '../orbit/winMapping';

describe('orbit winMapping', () => {
  it('localDayKey formats local YYYY-MM-DD', () => {
    expect(localDayKey(new Date(2026, 8, 13))).toBe('2026-09-13');
  });

  it('countsForOrbitStreak: preview false; save/tests/build/commit/debug true', () => {
    expect(countsForOrbitStreak('preview')).toBe(false);
    expect(countsForOrbitStreak('save')).toBe(true);
    expect(countsForOrbitStreak('tests')).toBe(true);
    expect(countsForOrbitStreak('build')).toBe(true);
    expect(countsForOrbitStreak('commit')).toBe(true);
    expect(countsForOrbitStreak('debug')).toBe(true);
  });

  it('toOrbitWinSize maps surface and kind', () => {
    expect(toOrbitWinSize('debug', 'small', 'panel')).toBe('medium');
    expect(toOrbitWinSize('save', 'small', 'statusbar')).toBe('small');
    expect(toOrbitWinSize('preview', 'small', 'overlay')).toBe('big');
    expect(toOrbitWinSize('tests', 'small', 'terminal')).toBe('big');
    expect(toOrbitWinSize('build', 'big', 'panel')).toBe('big');
  });
});

describe('orbit copy', () => {
  it('builds level / milestone / achievement captions', () => {
    expect(levelUpCaption(3).caption).toContain('3');
    expect(milestoneCaption(7).caption).toContain('7');
    expect(achievementsCaption(['first-liftoff']).caption).toBe('First liftoff');
  });

  it('coalesces medium follow-ups; prefers milestone on big', () => {
    const medium = mediumFollowUpCopy({
      leveledUp: true,
      level: 2,
      unlocked: ['green-suite'],
    });
    expect(medium?.caption).toContain('Level 2');
    expect(medium?.caption).toContain('Green suite');

    const big = bigFollowUpCopy({ milestone: 7, missionCompleted: true });
    expect(big?.caption).toContain('7');
    expect(big?.subline).toMatch(/mission/i);
  });
});

describe('OrbitStore applyWin + save (engine contract)', () => {
  it('preview path: applyWin with countsForStreak false leaves streakDays unchanged after save', async () => {
    const { OrbitStore } = await import('../orbit/store');
    let stored: unknown;
    const gs = {
      get<T>(key: string): T | undefined {
        return stored as T | undefined;
      },
      async update(_key: string, value: unknown): Promise<void> {
        stored = value;
      },
    };
    const store = new OrbitStore(gs);
    const before = store.load();
    const result = store.applyWin({
      dayKey: '2026-09-13',
      size: 'big',
      kind: 'preview',
      countsForStreak: false,
    });
    await store.save(result.state);
    expect(store.load().streakDays).toBe(before.streakDays);
    expect(result.state.streakDays).toBe(0);
  });
});
