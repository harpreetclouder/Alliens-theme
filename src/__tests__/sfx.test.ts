import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PACKS } from '../packs/registry';

const ROOT = path.join(__dirname, '..', '..');
const SFX_DIR = path.join(ROOT, 'media', 'sfx');

describe('pack SFX files', () => {
  for (const id of Object.keys(PACKS)) {
    it(`includes ${id}.wav on disk`, () => {
      const file = path.join(SFX_DIR, PACKS[id as keyof typeof PACKS].sfxFile);
      expect(fs.existsSync(file)).toBe(true);
      expect(fs.statSync(file).size).toBeGreaterThan(1000);
    });
  }

  it('wav files have valid RIFF header', () => {
    for (const id of Object.keys(PACKS)) {
      const file = path.join(SFX_DIR, PACKS[id as keyof typeof PACKS].sfxFile);
      const head = fs.readFileSync(file).subarray(0, 4).toString('ascii');
      expect(head).toBe('RIFF');
    }
  });
});
