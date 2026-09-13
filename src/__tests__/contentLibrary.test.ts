import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ContentLibrary, ContentBite } from '../celebrations/contentLibrary';
import { pickCaption } from '../celebrations/captions';

const bitesPath = join(__dirname, '..', '..', 'media', 'content', 'bites.json');

describe('content library bites.json', () => {
  it('has a valid expandable bites array', () => {
    const raw = JSON.parse(readFileSync(bitesPath, 'utf8')) as {
      bites: ContentBite[];
      anims: string[];
    };
    expect(raw.bites.length).toBeGreaterThan(10);
    expect(raw.anims.length).toBeGreaterThan(3);
    for (const bite of raw.bites) {
      expect(bite.id).toBeTruthy();
      expect(bite.line).toBeTruthy();
      expect(bite.kinds.length).toBeGreaterThan(0);
      expect(bite.packs.length).toBeGreaterThan(0);
    }
  });
});

describe('ContentLibrary', () => {
  it('picks matching bites for kind and pack', () => {
    const lib = new ContentLibrary([
      {
        id: 'a',
        kinds: ['tests'],
        packs: ['*'],
        tone: 'joke',
        anim: 'bounce-in',
        line: 'HELLO TESTS',
        subline: 'sub',
      },
      {
        id: 'b',
        kinds: ['commit'],
        packs: ['acid'],
        tone: 'satire',
        line: 'COMMIT ONLY',
      },
    ]);
    expect(lib.candidates('tests', 'mothership')).toHaveLength(1);
    expect(lib.pickBite('commit', 'acid', () => 0)?.id).toBe('b');
    expect(lib.pickBite('tests', 'root', () => 0)?.line).toBe('HELLO TESTS');
  });
});

describe('pickCaption with library', () => {
  it('can return a library bite when weight hits', () => {
    const lib = new ContentLibrary([
      {
        id: 'forced',
        kinds: ['tests'],
        packs: ['*'],
        tone: 'joke',
        anim: 'glitch-text',
        line: 'LIBRARY LINE',
        subline: 'from bites',
      },
    ]);
    // pickBite index, LIBRARY_WEIGHT check (< 0.94), then pickAnim randoms
    let i = 0;
    const values = [0, 0.1, 0.9, 0.9];
    const random = () => values[i++] ?? 0;
    const picked = pickCaption('tests', 'mothership', random, lib);
    expect(picked.source).toBe('library');
    expect(picked.line).toBe('LIBRARY LINE');
  });

  it('avoids excluded bite ids when alternatives exist', () => {
    const lib = new ContentLibrary([
      {
        id: 'a',
        kinds: ['*'],
        packs: ['*'],
        tone: 'joke',
        line: 'FIRST',
      },
      {
        id: 'b',
        kinds: ['*'],
        packs: ['*'],
        tone: 'joke',
        line: 'SECOND',
      },
    ]);
    const bite = lib.pickBite('preview', 'acid', () => 0, new Set(['a']));
    expect(bite?.id).toBe('b');
  });
});
