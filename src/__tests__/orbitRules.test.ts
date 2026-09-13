import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  MISSION_POOL,
  emptyOrbitState,
  ensureMission,
  levelFromXp,
  nextStreak,
  progressMission,
  xpForSize,
  xpThresholdForLevel,
  xpToNextLevel,
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

describe('xpToNextLevel', () => {
  it('uses level curve thresholds', () => {
    expect(xpThresholdForLevel(1)).toBe(0);
    expect(xpThresholdForLevel(2)).toBe(50);
    expect(xpThresholdForLevel(3)).toBe(200);
    expect(xpToNextLevel(0)).toBe(50);
    expect(xpToNextLevel(50)).toBe(150);
    expect(xpToNextLevel(200)).toBe(250);
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

describe('ensureMission', () => {
  const day = '2026-09-13';

  it('rolls a mission when none exists', () => {
    const state = emptyOrbitState();
    const next = ensureMission(state, day, () => 0);
    expect(next.mission).toEqual({
      id: 'commit-1',
      day,
      progress: 0,
      target: 1,
      completed: false,
    });
  });

  it('keeps the same mission on the same day', () => {
    const state = ensureMission(emptyOrbitState(), day, () => 0);
    const again = ensureMission(state, day, () => 0.99);
    expect(again.mission).toEqual(state.mission);
  });

  it('rolls a new mission when the day changes', () => {
    const state = ensureMission(emptyOrbitState(), day, () => 0);
    const nextDay = ensureMission(state, '2026-09-14', () => 0.99);
    expect(nextDay.mission?.day).toBe('2026-09-14');
    expect(nextDay.mission?.id).toBe('xp-50');
  });
});

describe('progressMission', () => {
  const day = '2026-09-13';

  function withMission(id: string, progress = 0): OrbitState {
    const def = MISSION_POOL.find((m) => m.id === id)!;
    return {
      ...emptyOrbitState(),
      mission: {
        id: def.id,
        day,
        progress,
        target: def.target,
        completed: false,
      },
    };
  }

  it('completes commit-1 on a commit win', () => {
    const { state, completed } = progressMission(withMission('commit-1'), 'commit', 25);
    expect(completed).toBe(true);
    expect(state.mission?.progress).toBe(1);
    expect(state.mission?.completed).toBe(true);
  });

  it('does not progress commit-1 on tests win', () => {
    const { state, completed } = progressMission(withMission('commit-1'), 'tests', 80);
    expect(completed).toBe(false);
    expect(state.mission?.progress).toBe(0);
  });

  it('accumulates XP toward xp-50', () => {
    let state = withMission('xp-50');
    let result = progressMission(state, 'commit', 25);
    expect(result.completed).toBe(false);
    expect(result.state.mission?.progress).toBe(25);
    result = progressMission(result.state, 'tests', 80);
    expect(result.completed).toBe(true);
    expect(result.state.mission?.progress).toBe(105);
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
