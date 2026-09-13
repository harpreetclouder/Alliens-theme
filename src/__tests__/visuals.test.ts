import { describe, it, expect } from 'vitest';
import { pickEmojis, PACK_EMOJI_POOL } from '../celebrations/emojis';
import { pickGif, GIFS } from '../celebrations/gifs';
import { pickCelebrationVisual } from '../celebrations/visuals';

describe('pickEmojis', () => {
  it('returns hero and three orbit emojis from pack pool', () => {
    const picked = pickEmojis('mothership', () => 0);
    expect(PACK_EMOJI_POOL.mothership).toContain(picked.hero);
    expect(picked.orbit).toHaveLength(3);
    expect(new Set([picked.hero, ...picked.orbit]).size).toBeGreaterThanOrEqual(2);
  });

  it('varies hero emoji with different random values', () => {
    const a = pickEmojis('glitch', () => 0).hero;
    const b = pickEmojis('glitch', () => 0.99).hero;
    expect(PACK_EMOJI_POOL.glitch).toContain(a);
    expect(PACK_EMOJI_POOL.glitch).toContain(b);
  });
});

describe('pickGif', () => {
  it('returns a gif for the active pack', () => {
    const gif = pickGif('soft', () => 0);
    expect(gif?.pack).toBe('soft');
    expect(gif?.file.startsWith('soft/')).toBe(true);
  });

  it('has three gifs per pack including acid', () => {
    for (const pack of ['mothership', 'glitch', 'soft', 'root', 'acid'] as const) {
      expect(GIFS.filter((g) => g.pack === pack).length).toBe(3);
    }
  });
});

describe('pickCelebrationVisual', () => {
  it('always includes gif on overlay when pack has gifs', () => {
    const visual = pickCelebrationVisual('mothership', 'overlay', () => 0);
    expect(visual.gif?.pack).toBe('mothership');
  });

  it('includes gif when cinematic flag is set for panel', () => {
    const visual = pickCelebrationVisual('acid', 'toast', () => 0, true);
    expect(visual.gif?.pack).toBe('acid');
  });

  it('skips gif on toast mode without cinematic', () => {
    for (let i = 0; i < 20; i++) {
      const visual = pickCelebrationVisual('root', 'toast');
      expect(visual.gif).toBeUndefined();
    }
  });
});
