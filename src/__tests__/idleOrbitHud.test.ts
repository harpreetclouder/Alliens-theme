import { describe, expect, it } from 'vitest';
import {
  buildIdlePanelHtml,
  idleOrbitViewFromState,
} from '../celebrations/celebrationHtml';

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
    expect(view.xpToNext).toBe(150);
    expect(view.streakDays).toBe(1);
    expect(view.missionLabel).toBe('Green tests once');
    expect(view.missionProgress).toBe(0);
    expect(view.missionTarget).toBe(1);
  });
});
