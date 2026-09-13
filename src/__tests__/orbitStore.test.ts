import { describe, expect, it } from 'vitest';
import { OrbitStore, type ApplyWinInput } from '../orbit/store';
import type { OrbitState } from '../orbit/types';

function fakeGlobalState(initial?: OrbitState) {
  let value: OrbitState | undefined = initial;
  return {
    get<T>(key: string): T | undefined {
      if (key !== 'orbital.orbit.v1') {
        return undefined;
      }
      return value as T | undefined;
    },
    async update(_key: string, next: OrbitState): Promise<void> {
      value = next;
    },
    snapshot: () => value,
  };
}

describe('OrbitStore', () => {
  const day = '2026-09-13';

  it('load returns empty state when nothing persisted', () => {
    const gs = fakeGlobalState();
    const store = new OrbitStore(gs);
    expect(store.load()).toEqual({
      xp: 0,
      level: 1,
      lastWinDay: '',
      streakDays: 0,
      unlocked: [],
      mission: null,
    });
  });

  it('save/load round-trips and re-derives level from xp', async () => {
    const gs = fakeGlobalState();
    const store = new OrbitStore(gs);
    const state: OrbitState = {
      xp: 80,
      level: 99,
      lastWinDay: day,
      streakDays: 1,
      unlocked: ['first-liftoff'],
      mission: null,
    };
    await store.save(state);
    expect(store.load()).toEqual({
      ...state,
      level: 2,
    });
  });

  it('applyWin: big tests win unlocks green-suite and first-liftoff, 80 XP, streak 1', () => {
    const gs = fakeGlobalState();
    const store = new OrbitStore(gs);
    const input: ApplyWinInput = {
      dayKey: day,
      size: 'big',
      kind: 'tests',
      countsForStreak: true,
    };
    const result = store.applyWin(input);
    expect(result.xpGained).toBe(80);
    expect(result.previousLevel).toBe(1);
    expect(result.leveledUp).toBe(true);
    expect(result.unlocked).toEqual(['first-liftoff', 'green-suite']);
    expect(result.missionCompleted).toBe(false);
    expect(result.state.xp).toBe(80);
    expect(result.state.level).toBe(2);
    expect(result.state.streakDays).toBe(1);
    expect(result.state.lastWinDay).toBe(day);
    expect(result.state.unlocked).toEqual(['first-liftoff', 'green-suite']);
  });

  it('applyWin: preview with countsForStreak false does not bump streak', () => {
    const gs = fakeGlobalState({
      xp: 0,
      level: 1,
      lastWinDay: '2026-09-12',
      streakDays: 4,
      unlocked: [],
      mission: null,
    });
    const store = new OrbitStore(gs);
    const result = store.applyWin({
      dayKey: day,
      size: 'big',
      kind: 'preview',
      countsForStreak: false,
    });
    expect(result.state.streakDays).toBe(4);
    expect(result.state.lastWinDay).toBe('2026-09-12');
    expect(result.milestone).toBeUndefined();
  });

  it('applyWin: commit win completes commit-1 mission with bonus XP and achievement', () => {
    const gs = fakeGlobalState({
      xp: 0,
      level: 1,
      lastWinDay: '',
      streakDays: 0,
      unlocked: [],
      mission: {
        id: 'commit-1',
        day,
        progress: 0,
        target: 1,
        completed: false,
      },
    });
    const store = new OrbitStore(gs);
    const result = store.applyWin({
      dayKey: day,
      size: 'medium',
      kind: 'commit',
      countsForStreak: true,
    });
    expect(result.missionCompleted).toBe(true);
    expect(result.xpGained).toBe(65);
    expect(result.state.mission?.completed).toBe(true);
    expect(result.state.unlocked).toContain('mission-complete');
    expect(result.state.xp).toBe(65);
  });

  it('applyWin: second win same day does not double streak days', () => {
    const gs = fakeGlobalState({
      xp: 80,
      level: 2,
      lastWinDay: day,
      streakDays: 1,
      unlocked: ['first-liftoff', 'green-suite'],
      mission: {
        id: 'tests-1',
        day,
        progress: 0,
        target: 1,
        completed: false,
      },
    });
    const store = new OrbitStore(gs);
    const result = store.applyWin({
      dayKey: day,
      size: 'medium',
      kind: 'commit',
      countsForStreak: true,
    });
    expect(result.state.streakDays).toBe(1);
    expect(result.state.lastWinDay).toBe(day);
    expect(result.xpGained).toBe(25);
  });
});
