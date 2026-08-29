import { describe, it, expect } from 'vitest';
import { buildTerminalCelebration, shellPrintCommand } from '../celebrations/terminalArt';

describe('buildTerminalCelebration', () => {
  it('includes pack, caption, and orbit emojis', () => {
    const art = buildTerminalCelebration({
      pack: 'mothership',
      caption: 'TASK ✓ BEAMED UP',
      subline: 'mothership approves',
      emoji: '👽',
      orbitEmojis: ['🛸', '⭐', '🌌'],
      tint: '#1cff9a',
      loopId: 'mothership-beam',
    });

    expect(art).toContain('ORBITAL');
    expect(art).toContain('MOTHERSHIP');
    expect(art).toContain('TASK ✓ BEAMED UP');
    expect(art).toContain('mothership approves');
    expect(art).toContain('👽');
    expect(art).toContain('🛸');
    expect(art).toContain('mothership-beam');
  });

  it('shellPrintCommand uses base64 node one-liner', () => {
    const cmd = shellPrintCommand('hello 👽');
    expect(cmd).toMatch(/^node -e/);
    expect(cmd).toContain('base64');
  });
});
