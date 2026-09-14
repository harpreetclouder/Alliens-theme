import type { BrainPreferences, BrainSignal, BrainState } from './types';
import { DEFAULT_PREFERENCES } from './types';

/** Apply a signal onto state (immutable). Injected clock via signal.atMs / nowMs. */
export function reduceState(
  prev: BrainState,
  signal: BrainSignal,
  patch: Partial<BrainState> = {},
): BrainState {
  const next: BrainState = {
    ...prev,
    ...patch,
    nowMs: patch.nowMs ?? signal.atMs,
    lastSignal: signal,
  };

  switch (signal.kind) {
    case 'typing':
      next.typing = true;
      next.idleMs = 0;
      break;
    case 'idle':
      next.typing = false;
      break;
    case 'quiet_on':
      next.preferences = { ...next.preferences, quietMode: true };
      break;
    case 'quiet_off':
      next.preferences = { ...next.preferences, quietMode: false };
      break;
    case 'dismiss':
      next.recentImmediateDismissals = next.recentImmediateDismissals + 1;
      break;
    case 'session_start':
      next.sessionActiveMs = 0;
      next.recentImmediateDismissals = 0;
      break;
    case 'long_session':
      next.sessionActiveMs = Math.max(next.sessionActiveMs, 45 * 60_000);
      break;
    default:
      break;
  }

  return next;
}

export function initialState(
  preferences: Partial<BrainPreferences> = {},
  nowMs = 0,
): BrainState {
  return {
    nowMs,
    typing: false,
    idleMs: 0,
    sessionActiveMs: 0,
    lastIntermissionAtMs: null,
    lastCelebrationAtMs: null,
    recentImmediateDismissals: 0,
    lastSignal: null,
    preferences: { ...DEFAULT_PREFERENCES, ...preferences },
  };
}
