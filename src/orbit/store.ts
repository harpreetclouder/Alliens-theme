import {
  emptyOrbitState,
  levelFromXp,
  nextStreak,
  xpForSize,
} from './rules';
import type { OrbitState, StreakUpdate } from './types';

export const ORBIT_STATE_KEY = 'orbital.orbit.v1';

export interface GlobalStateLike {
  get<T>(key: string): T | undefined;
  update(key: string, value: unknown): Thenable<void>;
}

export interface ApplyWinInput {
  dayKey: string;
  size: 'small' | 'medium' | 'big';
  kind: string;
  countsForStreak: boolean;
  regionId?: string;
}

export interface OrbitWinResult {
  state: OrbitState;
  xpGained: number;
  leveledUp: boolean;
  previousLevel: number;
  milestone?: number;
  unlocked: string[];
  missionCompleted: boolean;
}

function normalizeState(raw: OrbitState): OrbitState {
  return {
    ...raw,
    level: levelFromXp(raw.xp),
    unlocked: raw.unlocked ?? [],
    mission: raw.mission ?? null,
  };
}

function newAchievements(
  state: OrbitState,
  input: ApplyWinInput,
  streak: StreakUpdate,
): string[] {
  const already = new Set(state.unlocked);
  const ids: string[] = [];
  const tryAdd = (id: string) => {
    if (!already.has(id) && !ids.includes(id)) {
      ids.push(id);
    }
  };

  tryAdd('first-liftoff');
  if (input.kind === 'tests') {
    tryAdd('green-suite');
  }
  if (input.kind === 'commit') {
    tryAdd('commit-comet');
  }
  if (input.kind === 'debug') {
    tryAdd('debug-dodge');
  }
  if (streak.streakDays >= 7) {
    tryAdd('week-orbit');
  }
  if (input.regionId && input.regionId !== 'global') {
    tryAdd('region-scout');
  }

  return ids;
}

export class OrbitStore {
  constructor(private readonly globalState: GlobalStateLike) {}

  load(): OrbitState {
    const raw = this.globalState.get<OrbitState>(ORBIT_STATE_KEY);
    if (!raw) {
      return emptyOrbitState();
    }
    return normalizeState(raw);
  }

  async save(state: OrbitState): Promise<void> {
    await this.globalState.update(ORBIT_STATE_KEY, normalizeState(state));
  }

  applyWin(input: ApplyWinInput): OrbitWinResult {
    const current = this.load();
    const xpGained = xpForSize(input.size);
    const previousLevel = levelFromXp(current.xp);
    const xp = current.xp + xpGained;
    const level = levelFromXp(xp);
    const streak = nextStreak(current, input.dayKey, input.countsForStreak);
    const unlocked = newAchievements(current, input, streak);

    const state: OrbitState = normalizeState({
      ...current,
      xp,
      level,
      streakDays: streak.streakDays,
      lastWinDay: streak.lastWinDay,
      unlocked: [...current.unlocked, ...unlocked],
    });

    return {
      state,
      xpGained,
      leveledUp: level > previousLevel,
      previousLevel,
      milestone: streak.milestone,
      unlocked,
      missionCompleted: false,
    };
  }
}
