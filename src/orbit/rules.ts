import type {
  OrbitAchievementDef,
  OrbitMissionDef,
  OrbitState,
  StreakUpdate,
} from './types';

export type { OrbitState } from './types';

export const STREAK_MILESTONES = [3, 7, 14, 30] as const;

export const MISSION_COMPLETE_BONUS = 40;

export const MISSION_POOL: OrbitMissionDef[] = [
  { id: 'commit-1', label: 'Ship 1 commit', target: 1, kind: 'commit' },
  { id: 'tests-1', label: 'Green tests once', target: 1, kind: 'tests' },
  { id: 'xp-50', label: 'Earn 50 XP', target: 50, kind: 'xp' },
];

export const ACHIEVEMENTS: OrbitAchievementDef[] = [
  { id: 'first-liftoff', label: 'First liftoff' },
  { id: 'green-suite', label: 'Green suite' },
  { id: 'commit-comet', label: 'Commit comet' },
  { id: 'week-orbit', label: 'Week orbit' },
  { id: 'debug-dodge', label: 'Debug dodge' },
  { id: 'mission-complete', label: 'Mission complete' },
  { id: 'region-scout', label: 'Region scout' },
];

export function emptyOrbitState(): OrbitState {
  return {
    xp: 0,
    level: 1,
    lastWinDay: '',
    streakDays: 0,
    unlocked: [],
    mission: null,
  };
}

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function xpForSize(size: 'small' | 'medium' | 'big'): number {
  switch (size) {
    case 'small':
      return 5;
    case 'medium':
      return 25;
    case 'big':
      return 80;
  }
}

function dayDiffDays(fromDay: string, toDay: string): number {
  const parse = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };
  return Math.round((parse(toDay) - parse(fromDay)) / 86_400_000);
}

export function ensureMission(
  state: OrbitState,
  dayKey: string,
  random: () => number,
): OrbitState {
  if (state.mission?.day === dayKey) {
    return state;
  }
  const index =
    Math.floor(random() * MISSION_POOL.length) % MISSION_POOL.length;
  const def = MISSION_POOL[index];
  return {
    ...state,
    mission: {
      id: def.id,
      day: dayKey,
      progress: 0,
      target: def.target,
      completed: false,
    },
  };
}

export function progressMission(
  state: OrbitState,
  kind: string,
  xpGained: number,
): { state: OrbitState; completed: boolean } {
  const mission = state.mission;
  if (!mission || mission.completed) {
    return { state, completed: false };
  }

  const def = MISSION_POOL.find((m) => m.id === mission.id);
  if (!def) {
    return { state, completed: false };
  }

  let progress = mission.progress;
  if (def.kind === 'xp') {
    progress += xpGained;
  } else if (def.kind === kind) {
    progress += 1;
  }

  const completed = progress >= mission.target;
  return {
    state: {
      ...state,
      mission: {
        ...mission,
        progress,
        completed,
      },
    },
    completed,
  };
}

export function nextStreak(
  state: Pick<OrbitState, 'streakDays' | 'lastWinDay'>,
  dayKey: string,
  countsForStreak: boolean,
): StreakUpdate {
  if (!countsForStreak) {
    return { streakDays: state.streakDays, lastWinDay: state.lastWinDay };
  }

  const { lastWinDay, streakDays } = state;

  if (lastWinDay === dayKey) {
    return { streakDays, lastWinDay: dayKey };
  }

  let nextDays: number;
  if (!lastWinDay) {
    nextDays = 1;
  } else {
    const gap = dayDiffDays(lastWinDay, dayKey);
    nextDays = gap === 1 ? streakDays + 1 : 1;
  }

  const update: StreakUpdate = {
    streakDays: nextDays,
    lastWinDay: dayKey,
  };

  if ((STREAK_MILESTONES as readonly number[]).includes(nextDays)) {
    update.milestone = nextDays;
  }

  return update;
}
