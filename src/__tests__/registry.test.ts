import { describe, it, expect } from 'vitest';
import { isPackId, getPack, PACKS } from '../packs/registry';

describe('pack registry', () => {
  it('accepts five pack ids including acid', () => {
    expect(isPackId('mothership')).toBe(true);
    expect(isPackId('glitch')).toBe(true);
    expect(isPackId('soft')).toBe(true);
    expect(isPackId('root')).toBe(true);
    expect(isPackId('acid')).toBe(true);
    expect(isPackId('neon')).toBe(false);
  });

  it('returns tint and label for mothership and acid', () => {
    const pack = getPack('mothership');
    expect(pack.label).toBe('Mothership OS');
    expect(pack.tint).toMatch(/^#/);
    expect(getPack('acid').label).toBe('Acid Scrapbook');
    expect(getPack('acid').tint).toBe('#d6ff3c');
    expect(Object.keys(PACKS)).toHaveLength(5);
  });
});
