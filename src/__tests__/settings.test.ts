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
    expect(s.quietMode).toBe(false);
    expect(s.display).toBe('terminal');
    expect(s.surfaces).toEqual({});
    expect(s.intensity).toBe('normal');
    expect(s.soundEnabled).toBe(true);
    expect(s.triggers.tests).toBe(true);
    expect(s.triggers.save).toBe(false);
    expect(s.triggers.push).toBe(true);
    expect(s.joyRegion).toBe('auto');
    expect(s.giphySdkKey).toBe('');
  });

  it('reads quiet mode', () => {
    const s = readSettings(() => fakeConfig({ quietMode: true }) as never);
    expect(s.quietMode).toBe(true);
  });

  it('prefers giphy.sdkKey over legacy apiKey', () => {
    const s = readSettings(
      () =>
        fakeConfig({
          'giphy.sdkKey': 'sdk-key',
          'giphy.apiKey': 'api-key',
        }) as never,
    );
    expect(s.giphySdkKey).toBe('sdk-key');
  });

  it('falls back from giphy.apiKey then tenor.apiKey', () => {
    const s = readSettings(
      () => fakeConfig({ 'tenor.apiKey': 'old-tenor', 'giphy.apiKey': '' }) as never,
    );
    expect(s.giphySdkKey).toBe('old-tenor');
  });

  it('falls back on invalid pack id', () => {
    const s = readSettings(() => fakeConfig({ pack: 'nope' }) as never);
    expect(s.pack).toBe('mothership');
  });
});
