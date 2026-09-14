import type { BrainDecision, BrainState, OutcomeId } from './types';

const ALWAYS_FORBIDDEN_WHILE_TYPING: OutcomeId[] = ['overlay', 'intermission', 'comeback'];

/**
 * Hard interruption constraints. Personalization must never override these.
 */
export function applyHardConstraints(state: BrainState): {
  forbidden: OutcomeId[];
  trace: string[];
} {
  const forbidden = new Set<OutcomeId>();
  const trace: string[] = [];

  if (state.preferences.quietMode) {
    forbidden.add('overlay');
    forbidden.add('intermission');
    forbidden.add('comeback');
    forbidden.add('celebration');
    trace.push('quietMode → block discretionary surfaces');
  }

  if (state.typing) {
    for (const o of ALWAYS_FORBIDDEN_WHILE_TYPING) {
      forbidden.add(o);
    }
    trace.push('typing → block overlay/intermission/comeback');
  }

  if (!state.preferences.celebrationsEnabled) {
    forbidden.add('celebration');
    forbidden.add('overlay');
    trace.push('celebrationsEnabled=false');
  }

  if (
    state.lastIntermissionAtMs != null &&
    state.nowMs - state.lastIntermissionAtMs < state.preferences.intermissionCooldownMs
  ) {
    forbidden.add('intermission');
    trace.push('intermission cooldown active');
  }

  if (state.recentImmediateDismissals >= 3) {
    forbidden.add('intermission');
    forbidden.add('comeback');
    trace.push('dismissal adaptation → suppress discretionary intermissions');
  }

  return { forbidden: [...forbidden], trace };
}
