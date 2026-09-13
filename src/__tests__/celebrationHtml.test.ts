import { describe, expect, it } from 'vitest';
import {
  buildCelebrationHtml,
  buildIdlePanelHtml,
  idleOrbitViewFromState,
} from '../celebrations/celebrationHtml';
import { CELEBRATION_DURATION_MS } from '../celebrations/durations';

const base = {
  cssUri: 'https://example/celebration.css',
  loopClass: 'loop-orbit',
  caption: 'Ship it.',
  emoji: '🛸',
  orbitEmojis: ['✨', '🎉', '🙌'] as [string, string, string],
  tint: '#1cff9a',
  reduceMotion: false,
  durationMs: CELEBRATION_DURATION_MS.scene,
  exitLeadMs: 1000,
  cspSource: 'https://csp.example',
};

describe('buildCelebrationHtml joy collage', () => {
  it('renders meme collage with gif, stickers, and region label', () => {
    const html = buildCelebrationHtml({
      ...base,
      mode: 'overlay',
      collage: true,
      gifUri: 'https://csp.example/g.gif',
      regionId: 'in',
      regionLabel: 'India',
      pack: 'acid',
      surface: 'overlay',
    });

    expect(html).toContain('joy-collage');
    expect(html).toContain('collage-gif');
    expect(html).toContain('joke-card');
    expect(html).toContain('sticker');
    expect(html).toContain('India');
    expect(html).not.toContain('scene.bundle.js');
    expect(html).not.toContain('id="fxCanvas"');
  });

  it('allows https img-src when remote gif url is used', () => {
    const html = buildCelebrationHtml({
      ...base,
      mode: 'panel',
      collage: true,
      gifUri: 'https://media.giphy.com/x.gif',
      surface: 'panel',
    });
    expect(html).toContain('img-src https://csp.example https:');
  });

  it('shows Powered by GIPHY when attribution flag is set', () => {
    const html = buildCelebrationHtml({
      ...base,
      mode: 'overlay',
      collage: true,
      gifUri: 'https://media.giphy.com/x.gif',
      giphyAttribution: true,
    });
    expect(html).toContain('Powered by GIPHY');
  });
});

describe('scene duration constant', () => {
  it('is 9000ms for collage celebrations', () => {
    expect(CELEBRATION_DURATION_MS.scene).toBe(9000);
  });
});

describe('buildIdlePanelHtml orbit HUD', () => {
  it('renders standing-by idle without orbit', () => {
    const html = buildIdlePanelHtml('https://csp.example', 'https://example/celebration.css');
    expect(html).toContain('mode-idle');
    expect(html).toContain('Orbital standing by');
    expect(html).not.toContain('idle-orbit-card');
  });

  it('renders level, streak, mission, and xp bar when orbit is provided', () => {
    const html = buildIdlePanelHtml('https://csp.example', 'https://example/celebration.css', {
      level: 2,
      xp: 80,
      xpToNext: 120,
      streakDays: 3,
      missionLabel: 'Ship 1 commit',
      missionProgress: 0,
      missionTarget: 1,
    });
    expect(html).toContain('idle-orbit-card');
    expect(html).toContain('L2');
    expect(html).toContain('80 XP · 120 to next');
    expect(html).toContain('🔥 3');
    expect(html).toContain('Ship 1 commit · 0/1');
    expect(html).toContain('idle-orbit-fill');
  });
});

describe('idleOrbitViewFromState', () => {
  it('maps OrbitState with xpToNext from level curve', () => {
    const view = idleOrbitViewFromState({
      xp: 50,
      level: 2,
      streakDays: 1,
      mission: { id: 'tests-1', progress: 0, target: 1 },
    });
    expect(view.level).toBe(2);
    expect(view.xp).toBe(50);
    expect(view.xpToNext).toBe(150); // next at 200
    expect(view.streakDays).toBe(1);
    expect(view.missionLabel).toBe('Green tests once');
    expect(view.missionProgress).toBe(0);
    expect(view.missionTarget).toBe(1);
  });
});
