import { describe, it, expect } from 'vitest';
import { isPackId, getPack, PACKS } from '../packs/registry';

describe('pack registry', () => {
  it('accepts only four pack ids', () => {
    expect(isPackId('mothership')).toBe(true);
    expect(isPackId('glitch')).toBe(true);
    expect(isPackId('soft')).toBe(true);
    expect(isPackId('root')).toBe(true);
    expect(isPackId('neon')).toBe(false);
  });

  it('returns tint and label for mothership', () => {
    const pack = getPack('mothership');
    expect(pack.label).toBe('Mothership OS');
    expect(pack.tint).toMatch(/^#/);
    expect(Object.keys(PACKS)).toHaveLength(4);
  });
});
