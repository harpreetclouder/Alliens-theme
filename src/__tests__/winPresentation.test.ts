import { describe, expect, it } from 'vitest';
import {
  presentationForWin,
  resolveCaption,
  winKindToOutcome,
} from '../packs/winPresentation';

describe('winPresentation', () => {
  it('maps commit to celebration outcome and pack label caption', () => {
    expect(winKindToOutcome('commit')).toBe('celebration');
    const p = presentationForWin('mothership', 'commit');
    expect(p.tint).toBe('#1cff9a');
    expect(resolveCaption('commit', p, 'FALLBACK')).toBe('TRANSMISSION CLEAR');
    expect(resolveCaption('tests', p, 'TESTS ✓')).toBe('TESTS ✓');
  });

  it('maps checkin to comeback presentation labels per pack', () => {
    expect(winKindToOutcome('checkin')).toBe('comeback');
    expect(presentationForWin('glitch', 'checkin').outcomeLabel).toBe('SYSTEM RESTORED');
    expect(presentationForWin('root', 'checkin').outcomeLabel).toBe(
      'process recovered successfully',
    );
  });

  it('keeps same win → same outcome across packs (presentation differs)', () => {
    expect(winKindToOutcome('build')).toBe('celebration');
    const a = presentationForWin('mothership', 'build').outcomeLabel;
    const b = presentationForWin('soft', 'build').outcomeLabel;
    expect(a).not.toBe(b);
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
  });
});
