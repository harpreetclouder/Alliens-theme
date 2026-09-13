import {
  MISSION_COMPLETE_BONUS,
  emptyOrbitState,
  ensureMission,
  levelFromXp,
  nextStreak,
  progressMission,
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
  missionCompleted: boolean,
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
  if (missionCompleted) {
    tryAdd('mission-complete');
  }

  return ids;
}

export class OrbitStore {
  private cached: OrbitState | undefined;

  constructor(
    private readonly globalState: GlobalStateLike,
    private readonly random: () => number = Math.random,
  ) {}

  load(): OrbitState {
    if (this.cached) {
      return this.cached;
    }
    const raw = this.globalState.get<OrbitState>(ORBIT_STATE_KEY);
    const state = raw ? normalizeState(raw) : emptyOrbitState();
    this.cached = state;
    return state;
  }

  /**
   * Persist in-memory cache. Optional `state` is ignored when older than cache
   * (lower xp) so a lagged await cannot overwrite a newer applyWin.
   */
  async save(state?: OrbitState): Promise<void> {
    const current = this.cached ?? this.load();
    if (state !== undefined && state.xp >= current.xp) {
      this.cached = normalizeState(state);
    }
    await this.globalState.update(ORBIT_STATE_KEY, this.cached ?? current);
  }

  applyWin(input: ApplyWinInput): OrbitWinResult {
    const current = this.load();
    const withMission = ensureMission(current, input.dayKey, this.random);
    const baseXp = xpForSize(input.size);
    const missionStep = progressMission(withMission, input.kind, baseXp);
    const missionCompleted = missionStep.completed;
    const xpGained = baseXp + (missionCompleted ? MISSION_COMPLETE_BONUS : 0);
    const previousLevel = levelFromXp(withMission.xp);
    const xp = withMission.xp + xpGained;
    const level = levelFromXp(xp);
    const streak = nextStreak(withMission, input.dayKey, input.countsForStreak);
    const unlocked = newAchievements(
      withMission,
      input,
      streak,
      missionCompleted,
    );

    const state: OrbitState = normalizeState({
      ...missionStep.state,
      xp,
      level,
      streakDays: streak.streakDays,
      lastWinDay: streak.lastWinDay,
      unlocked: [...withMission.unlocked, ...unlocked],
    });

    this.cached = state;

    return {
      state,
      xpGained,
      leveledUp: level > previousLevel,
      previousLevel,
      milestone: streak.milestone,
      unlocked,
      missionCompleted,
    };
  }
}
