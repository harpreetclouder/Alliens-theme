import { describe, expect, it, vi } from 'vitest';
import type { CelebrationHost } from '../celebrations/host';
import type { OrbitalSettings } from '../config/settings';
import {
  CHECK_IN_DAY_KEY,
  dayStartIfNeeded,
  type DayStartContext,
} from '../orbit/dayStart';
import { OrbitStore } from '../orbit/store';

function settings(partial: Partial<OrbitalSettings> = {}): OrbitalSettings {
  return {
    pack: 'mothership',
    celebrationsEnabled: true,
    orbitEnabled: true,
    display: 'terminal',
    surfaces: {},
    intensity: 'normal',
    triggers: { tests: true, build: true, commit: true, debug: true, save: false },
    soundEnabled: false,
    mutedPacks: [],
    reduceMotion: 'never',
    joyRegion: 'auto',
    giphySdkKey: '',
    ...partial,
  };
}

function mockContext(initialDay?: string): DayStartContext & {
  state: Map<string, unknown>;
} {
  const state = new Map<string, unknown>();
  if (initialDay !== undefined) {
    state.set(CHECK_IN_DAY_KEY, initialDay);
  }
  return {
    state,
    extensionUri: { fsPath: '/tmp/orbital' } as DayStartContext['extensionUri'],
    globalState: {
      get<T>(key: string): T | undefined {
        return state.get(key) as T | undefined;
      },
      async update(key: string, value: unknown): Promise<void> {
        state.set(key, value);
      },
    },
  };
}

describe('dayStartIfNeeded', () => {
  it('rolls mission, awards small XP, whispers once per local day', async () => {
    const ctx = mockContext();
    const gs = {
      get<T>(key: string): T | undefined {
        return undefined;
      },
      async update(): Promise<void> {},
    };
    const store = new OrbitStore(gs, () => 0);
    const shown: unknown[] = [];
    const host = {
      show: (args: unknown) => {
        shown.push(args);
      },
      updateOrbitCrumb: vi.fn(),
    } as CelebrationHost;

    const day = new Date(2026, 8, 13);
    const first = await dayStartIfNeeded(ctx, store, host, settings(), day);
    expect(first).toBe('done');
    expect(ctx.state.get(CHECK_IN_DAY_KEY)).toBe('2026-09-13');
    expect(store.load().xp).toBe(5);
    expect(store.load().mission?.day).toBe('2026-09-13');
    expect(store.load().streakDays).toBe(1);
    expect(shown).toHaveLength(1);
    expect((shown[0] as { surface: string }).surface).toBe('statusbar');
    expect((shown[0] as { subline: string }).subline).toMatch(/commit|tests|XP/i);

    const second = await dayStartIfNeeded(ctx, store, host, settings(), day);
    expect(second).toBe('skipped');
    expect(store.load().xp).toBe(5);
    expect(shown).toHaveLength(1);
  });

  it('skips when orbit disabled', async () => {
    const ctx = mockContext();
    const store = new OrbitStore({
      get: () => undefined,
      update: async () => {},
    });
    const host = { show: vi.fn(), updateOrbitCrumb: vi.fn() } as unknown as CelebrationHost;
    const result = await dayStartIfNeeded(
      ctx,
      store,
      host,
      settings({ orbitEnabled: false }),
      new Date(2026, 8, 13),
    );
    expect(result).toBe('skipped');
    expect(host.show).not.toHaveBeenCalled();
  });
});
