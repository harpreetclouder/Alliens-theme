import { describe, expect, it } from 'vitest';
import { decide } from '../brain/decide';
import { runScenario } from '../brain/evalRunner';
import { initialState, reduceState } from '../brain/state';
import { AdaptiveExperiencePolicy } from '../brain/adaptive';

describe('brain decide', () => {
  it('blocks overlay while typing after tests_pass', () => {
    let s = initialState({}, 0);
    s = reduceState(s, { kind: 'tests_pass', atMs: 1000 }, { idleMs: 5000, typing: false });
    s = reduceState(s, { kind: 'typing', atMs: 1001 }, { typing: true, idleMs: 0 });
    const d = decide(s);
    expect(d.forbidden).toContain('overlay');
    expect(d.outcome).not.toBe('overlay');
  });

  it('allows intermission after long session when idle', () => {
    let s = initialState({}, 0);
    s = reduceState(
      s,
      { kind: 'long_session', atMs: 2_700_000 },
      { sessionActiveMs: 2_700_000, idleMs: 5000, typing: false },
    );
    expect(decide(s).outcome).toBe('intermission');
  });
});

describe('adaptive policy', () => {
  it('ranks completed experiences higher', () => {
    const p = new AdaptiveExperiencePolicy();
    const a = { channel: 'intermission', experienceKind: 'puzzle' };
    const b = { channel: 'intermission', experienceKind: 'trivia' };
    p.observe(a, 'completed');
    p.observe(b, 'immediate_dismiss');
    expect(p.rank([b, a])[0]).toEqual(a);
  });
});

describe('eval scenarios on disk', () => {
  it('quiet-mode scenario passes', () => {
    const r = runScenario({
      id: 'quiet-mode',
      preferences: { quietMode: true },
      timeline: [
        { atMs: 0, signal: 'quiet_on' },
        { atMs: 1000, signal: 'tests_pass', patch: { idleMs: 5000, typing: false } },
      ],
      expect: {
        outcome: 'none',
        forbiddenIncludes: ['celebration', 'overlay', 'intermission', 'comeback'],
      },
    });
    expect(r.pass, r.failures.join('; ')).toBe(true);
  });
});
