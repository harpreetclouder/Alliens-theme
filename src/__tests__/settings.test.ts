import { describe, it, expect } from 'vitest';
import { readSettings } from '../config/settings';

function fakeConfig(map: Record<string, unknown>) {
  return {
    get<T>(key: string, defaultValue: T): T {
      return (key in map ? map[key] : defaultValue) as T;
    },
  };
}

describe('readSettings', () => {
  it('applies defaults', () => {
    const s = readSettings(() => fakeConfig({}) as never);
    expect(s.pack).toBe('mothership');
    expect(s.celebrationsEnabled).toBe(true);
    expect(s.orbitEnabled).toBe(true);
    expect(s.display).toBe('terminal');
    expect(s.surfaces).toEqual({});
    expect(s.intensity).toBe('normal');
    expect(s.soundEnabled).toBe(true);
    expect(s.triggers.tests).toBe(true);
    expect(s.triggers.save).toBe(false);
  });

  it('reads orbital.orbit.enabled override', () => {
    const s = readSettings(() => fakeConfig({ 'orbit.enabled': false }) as never);
    expect(s.orbitEnabled).toBe(false);
  });

  it('falls back on invalid pack id', () => {
    const s = readSettings(() => fakeConfig({ pack: 'nope' }) as never);
    expect(s.pack).toBe('mothership');
  });
});
