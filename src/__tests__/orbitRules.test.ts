import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  MISSION_POOL,
  emptyOrbitState,
  levelFromXp,
  nextStreak,
  xpForSize,
} from '../orbit/rules';
import type { OrbitState } from '../orbit/types';

describe('levelFromXp', () => {
  it('maps 0 XP to level 1', () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it('maps 50 XP to level 2', () => {
    expect(levelFromXp(50)).toBe(2);
  });

  it('maps 200 XP to level 3', () => {
    expect(levelFromXp(200)).toBe(3);
  });
});

describe('xpForSize', () => {
  it('returns spec XP values', () => {
    expect(xpForSize('small')).toBe(5);
    expect(xpForSize('medium')).toBe(25);
    expect(xpForSize('big')).toBe(80);
  });
});

describe('emptyOrbitState', () => {
  it('starts at level 1 with zero progress', () => {
    expect(emptyOrbitState()).toEqual({
      xp: 0,
      level: 1,
      lastWinDay: '',
      streakDays: 0,
      unlocked: [],
      mission: null,
    });
  });
});

describe('nextStreak', () => {
  const base = (overrides: Partial<OrbitState>): OrbitState => ({
    ...emptyOrbitState(),
    ...overrides,
  });

  it('starts streak at 1 on first counting win', () => {
    expect(nextStreak(base({}), '2026-09-13', true)).toEqual({
      streakDays: 1,
      lastWinDay: '2026-09-13',
    });
  });

  it('increments on consecutive calendar day', () => {
    const state = base({ streakDays: 1, lastWinDay: '2026-09-12' });
    expect(nextStreak(state, '2026-09-13', true)).toEqual({
      streakDays: 2,
      lastWinDay: '2026-09-13',
    });
  });

  it('resets streak after a broken day', () => {
    const state = base({ streakDays: 5, lastWinDay: '2026-09-10' });
    expect(nextStreak(state, '2026-09-13', true)).toEqual({
      streakDays: 1,
      lastWinDay: '2026-09-13',
    });
  });

  it('does not increment twice on the same day', () => {
    const state = base({ streakDays: 3, lastWinDay: '2026-09-13' });
    expect(nextStreak(state, '2026-09-13', true)).toEqual({
      streakDays: 3,
      lastWinDay: '2026-09-13',
    });
  });

  it('leaves streak unchanged when win does not count', () => {
    const state = base({ streakDays: 4, lastWinDay: '2026-09-12' });
    expect(nextStreak(state, '2026-09-13', false)).toEqual({
      streakDays: 4,
      lastWinDay: '2026-09-12',
    });
  });

  it('emits milestone 7 when streak reaches 7', () => {
    const state = base({ streakDays: 6, lastWinDay: '2026-09-12' });
    expect(nextStreak(state, '2026-09-13', true)).toEqual({
      streakDays: 7,
      lastWinDay: '2026-09-13',
      milestone: 7,
    });
  });
});

describe('MISSION_POOL and ACHIEVEMENTS', () => {
  it('exports v1 mission ids', () => {
    expect(MISSION_POOL.map((m) => m.id)).toEqual(['commit-1', 'tests-1', 'xp-50']);
  });

  it('exports v1 achievement ids', () => {
    expect(ACHIEVEMENTS.map((a) => a.id)).toEqual([
      'first-liftoff',
      'green-suite',
      'commit-comet',
      'week-orbit',
      'debug-dodge',
      'mission-complete',
      'region-scout',
    ]);
  });
});
