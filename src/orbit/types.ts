export interface OrbitMission {
  id: string;
  day: string;
  progress: number;
  target: number;
  completed: boolean;
}

export interface OrbitState {
  xp: number;
  level: number;
  lastWinDay: string;
  streakDays: number;
  unlocked: string[];
  mission: OrbitMission | null;
}

export interface OrbitMissionDef {
  id: string;
  label: string;
  target: number;
  kind: 'commit' | 'tests' | 'xp';
}

export interface OrbitAchievementDef {
  id: string;
  label: string;
}

export interface StreakUpdate {
  streakDays: number;
  lastWinDay: string;
  milestone?: number;
}
