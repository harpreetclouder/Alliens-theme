/**
 * Orbital Brain — pure interruption / outcome decisions (no vscode).
 * Platform adapters feed normalized context; evals drive scenarios.
 */

export type OutcomeId =
  | 'none'
  | 'celebration'
  | 'comeback'
  | 'intermission'
  | 'overlay'
  | 'statusbar';

export type SignalKind =
  | 'session_start'
  | 'tests_fail'
  | 'tests_pass'
  | 'commit'
  | 'typing'
  | 'idle'
  | 'long_session'
  | 'dismiss'
  | 'quiet_on'
  | 'quiet_off';

export interface BrainSignal {
  kind: SignalKind;
  atMs: number;
}

export interface BrainPreferences {
  celebrationsEnabled: boolean;
  quietMode: boolean;
  intermissionCooldownMs: number;
}

export interface BrainState {
  nowMs: number;
  typing: boolean;
  idleMs: number;
  sessionActiveMs: number;
  lastIntermissionAtMs: number | null;
  lastCelebrationAtMs: number | null;
  recentImmediateDismissals: number;
  lastSignal: BrainSignal | null;
  preferences: BrainPreferences;
}

export interface BrainDecision {
  outcome: OutcomeId;
  allowed: OutcomeId[];
  forbidden: OutcomeId[];
  reason: string;
  trace: string[];
}

export const DEFAULT_PREFERENCES: BrainPreferences = {
  celebrationsEnabled: true,
  quietMode: false,
  intermissionCooldownMs: 10 * 60_000,
};
