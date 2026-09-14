import { applyHardConstraints } from './interruptionPolicy';
import type { BrainDecision, BrainState, OutcomeId } from './types';

const LONG_SESSION_MS = 45 * 60_000;
const SAFE_IDLE_MS = 3_000;

/**
 * Deterministic Orbital Brain decision.
 * Does not call network or vscode — safe for evals.
 */
export function decide(state: BrainState): BrainDecision {
  const { forbidden, trace } = applyHardConstraints(state);
  const allowed: OutcomeId[] = (['none', 'statusbar', 'celebration', 'overlay', 'comeback', 'intermission'] as OutcomeId[])
    .filter((o) => !forbidden.includes(o));

  const signal = state.lastSignal;
  let outcome: OutcomeId = 'none';
  let reason = 'default none';

  if (signal?.kind === 'tests_pass' && !forbidden.includes('celebration')) {
    if (state.typing) {
      outcome = 'statusbar';
      reason = 'tests_pass while typing → statusbar only';
      trace.push(reason);
    } else if (state.idleMs >= SAFE_IDLE_MS && !forbidden.includes('overlay')) {
      outcome = 'overlay';
      reason = 'tests_pass + safe idle → celebration overlay';
      trace.push(reason);
    } else if (!forbidden.includes('celebration')) {
      outcome = 'celebration';
      reason = 'tests_pass → celebration';
      trace.push(reason);
    }
  } else if (signal?.kind === 'commit' && !forbidden.includes('celebration') && !forbidden.includes('overlay')) {
    outcome = state.typing ? 'statusbar' : 'overlay';
    reason = state.typing ? 'commit while typing → statusbar' : 'commit → overlay celebration';
    trace.push(reason);
  } else if (
    signal?.kind === 'long_session' &&
    state.sessionActiveMs >= LONG_SESSION_MS &&
    !state.typing &&
    state.idleMs >= SAFE_IDLE_MS &&
    !forbidden.includes('intermission')
  ) {
    outcome = 'intermission';
    reason = 'long active session + safe idle → intermission eligible';
    trace.push(reason);
  } else if (
    signal?.kind === 'idle' &&
    state.idleMs >= SAFE_IDLE_MS &&
    !state.typing &&
    !forbidden.includes('comeback') &&
    state.lastSignal?.kind !== 'typing'
  ) {
    // Comeback only after a recent tests_pass in the scenario timeline (caller sets lastSignal)
    outcome = 'none';
    reason = 'idle without qualifying win';
    trace.push(reason);
  }

  // Comeback: after tests_pass then brief typing then idle gap
  if (
    signal?.kind === 'idle' &&
    state.idleMs >= SAFE_IDLE_MS &&
    !state.typing &&
    !forbidden.includes('comeback') &&
    !forbidden.includes('overlay')
  ) {
    // Prefer comeback when celebrations enabled and not quiet — scenarios assert allowed set
    if (allowed.includes('comeback') && state.sessionActiveMs > 0) {
      outcome = 'comeback';
      reason = 'safe idle gap → comeback eligible';
      trace.push(reason);
    }
  }

  if (forbidden.includes(outcome)) {
    trace.push(`outcome ${outcome} forbidden → none`);
    outcome = 'none';
    reason = 'blocked by hard constraints';
  }

  return { outcome, allowed, forbidden, reason, trace };
}
