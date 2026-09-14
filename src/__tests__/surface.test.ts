import { describe, it, expect } from 'vitest';
import { resolveSurface, DEFAULT_SURFACES } from '../celebrations/surface';

describe('resolveSurface', () => {
  it('defaults tests to terminal and preview to cinematic overlay', () => {
    expect(resolveSurface('tests', 'small', {}, 'normal', undefined, 'panel')).toBe(
      'terminal',
    );
    expect(resolveSurface('preview', 'small', {}, 'normal', undefined, 'panel')).toBe(
      'overlay',
    );
  });

  it('uses terminalNative meta for extension companion', () => {
    expect(
      resolveSurface('commit', 'small', {}, 'normal', { terminalNative: true }, 'panel'),
    ).toBe('terminal');
  });

  it('chill maps non-terminal kinds to statusbar', () => {
    expect(resolveSurface('commit', 'small', {}, 'chill', undefined, 'panel')).toBe(
      'statusbar',
    );
    expect(resolveSurface('save', 'small', {}, 'chill', undefined, 'panel')).toBe(
      'statusbar',
    );
  });

  it('honours per-trigger surface overrides', () => {
    expect(
      resolveSurface('commit', 'small', { commit: 'overlay' }, 'normal', undefined, 'panel'),
    ).toBe('overlay');
    expect(
      resolveSurface('build', 'big', { build: 'terminal' }, 'normal', undefined, 'panel'),
    ).toBe('terminal');
  });

  it('uses default surfaces for commit/build/debug/save/checkin/pack', () => {
    expect(DEFAULT_SURFACES.commit).toBe('overlay');
    expect(DEFAULT_SURFACES.save).toBe('statusbar');
    expect(DEFAULT_SURFACES.checkin).toBe('statusbar');
    expect(DEFAULT_SURFACES.pack).toBe('statusbar');
    expect(
      resolveSurface('commit', 'small', {}, 'normal', undefined, 'panel'),
    ).toBe('overlay');
    expect(
      resolveSurface('save', 'small', {}, 'normal', undefined, 'panel'),
    ).toBe('statusbar');
    expect(
      resolveSurface('checkin', 'small', {}, 'normal', undefined, 'panel'),
    ).toBe('statusbar');
    expect(
      resolveSurface('pack', 'small', {}, 'normal', undefined, 'panel'),
    ).toBe('statusbar');
  });

  it('hype upgrades big wins to overlay', () => {
    expect(resolveSurface('build', 'big', {}, 'hype', undefined, 'panel')).toBe('overlay');
  });

  it('display=overlay overrides stale panel surface for commit', () => {
    expect(
      resolveSurface('commit', 'small', { commit: 'panel' }, 'hype', undefined, 'overlay'),
    ).toBe('overlay');
  });

  it('falls back display setting for rich triggers', () => {
    expect(resolveSurface('build', 'big', {}, 'normal', undefined, 'overlay')).toBe(
      'overlay',
    );
  });
});
