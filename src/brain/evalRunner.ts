import { decide } from './decide';
import { applyHardConstraints } from './interruptionPolicy';
import type { BrainDecision, BrainState, OutcomeId, SignalKind } from './types';
import { initialState, reduceState } from './state';

export interface EvalEvent {
  atMs: number;
  signal: SignalKind;
  /** Optional state patches (idleMs, sessionActiveMs, …) */
  patch?: Partial<BrainState>;
}

export interface EvalScenario {
  id: string;
  description?: string;
  preferences?: Partial<BrainState['preferences']>;
  timeline: EvalEvent[];
  /** Assert on final decision after last event */
  expect: {
    outcome?: OutcomeId | OutcomeId[];
    allowedIncludes?: OutcomeId[];
    forbiddenIncludes?: OutcomeId[];
    forbiddenExcludes?: OutcomeId[];
  };
}

export interface EvalResult {
  id: string;
  pass: boolean;
  decision: BrainDecision;
  expected: EvalScenario['expect'];
  failures: string[];
  trace: string[];
}

function matchesOutcome(actual: OutcomeId, expected: OutcomeId | OutcomeId[]): boolean {
  return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
}

export function runScenario(scenario: EvalScenario): EvalResult {
  let state = initialState(scenario.preferences ?? {}, 0);
  let decision: BrainDecision = {
    outcome: 'none',
    allowed: [],
    forbidden: [],
    reason: 'empty',
    trace: [],
  };

  for (const ev of scenario.timeline) {
    state = reduceState(
      state,
      { kind: ev.signal, atMs: ev.atMs },
      { ...ev.patch, nowMs: ev.atMs },
    );
    decision = decide(state);
  }

  const failures: string[] = [];
  const exp = scenario.expect;
  if (exp.outcome !== undefined && !matchesOutcome(decision.outcome, exp.outcome)) {
    failures.push(`outcome=${decision.outcome} expected ${JSON.stringify(exp.outcome)}`);
  }
  for (const a of exp.allowedIncludes ?? []) {
    if (!decision.allowed.includes(a)) {
      failures.push(`allowed missing ${a}`);
    }
  }
  for (const f of exp.forbiddenIncludes ?? []) {
    if (!decision.forbidden.includes(f)) {
      failures.push(`forbidden missing ${f}`);
    }
  }
  for (const f of exp.forbiddenExcludes ?? []) {
    if (decision.forbidden.includes(f)) {
      failures.push(`forbidden unexpectedly has ${f}`);
    }
  }

  return {
    id: scenario.id,
    pass: failures.length === 0,
    decision,
    expected: exp,
    failures,
    trace: decision.trace,
  };
}

/** Mid-timeline assertion helper for typing-block scenarios */
export function decisionAt(
  scenario: EvalScenario,
  afterEventIndex: number,
): BrainDecision {
  let state = initialState(scenario.preferences ?? {}, 0);
  let decision: BrainDecision = decide(state);
  for (let i = 0; i <= afterEventIndex; i++) {
    const ev = scenario.timeline[i]!;
    state = reduceState(
      state,
      { kind: ev.signal, atMs: ev.atMs },
      { ...ev.patch, nowMs: ev.atMs },
    );
    decision = decide(state);
  }
  return decision;
}

export { applyHardConstraints, decide, initialState, reduceState };
