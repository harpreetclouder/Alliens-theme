import { describe, expect, it } from 'vitest';
import { getExperiencePack, listExperiencePackIds } from '../packs/experiencePacks';
import { resolvePresentation } from '../packs/presentation';
import { getPack, isPackId, PACKS, PACK_THEME_LABELS } from '../packs/registry';
import { resolveVisualState } from '../packs/visualState';
import type { PackId } from '../packs/types';

describe('experience packs', () => {
  it('ships five builtin manifests with stable compatibility fields', () => {
    expect(listExperiencePackIds()).toHaveLength(5);
    for (const id of listExperiencePackIds()) {
      const xp = getExperiencePack(id);
      expect(xp.schemaVersion).toBe(1);
      expect(xp.themeLabel.startsWith('Orbital —')).toBe(true);
      expect(xp.visualTheme.tokens.accent).toMatch(/^#/);
      expect(getPack(id).tint).toBe(xp.visualTheme.tokens.accent);
      expect(PACK_THEME_LABELS[id]).toBe(xp.themeLabel);
    }
    expect(Object.keys(PACKS)).toHaveLength(5);
  });

  it('keeps pack-specific comeback labels without changing outcome identity', () => {
    expect(getExperiencePack('mothership').personality.outcomeLabels?.comeback).toBe(
      'MISSION RECOVERED',
    );
    expect(getExperiencePack('glitch').personality.outcomeLabels?.comeback).toBe(
      'SYSTEM RESTORED',
    );
    expect(getExperiencePack('root').personality.outcomeLabels?.comeback).toBe(
      'process recovered successfully',
    );
    expect(getExperiencePack('soft').personality.outcomeLabels?.comeback).toContain(
      'back on track',
    );
  });
});

describe('resolveVisualState', () => {
  it('is independent of pack id', () => {
    const ctx = { outcome: 'comeback' as const, typing: false, quietMode: false };
    expect(resolveVisualState(ctx)).toBe('comeback');
  });

  it('maps quiet and typing to hard presentation states', () => {
    expect(resolveVisualState({ quietMode: true, outcome: 'celebration' })).toBe('quiet');
    expect(resolveVisualState({ typing: true, outcome: 'celebration' })).toBe('focus');
  });

  it('maps celebration/overlay outcomes', () => {
    expect(resolveVisualState({ outcome: 'celebration' })).toBe('celebration');
    expect(resolveVisualState({ outcome: 'overlay' })).toBe('celebration');
    expect(resolveVisualState({ waiting: true })).toBe('waiting');
  });
});

describe('resolvePresentation', () => {
  it('returns accent tint and blocks ambient in focus/quiet', () => {
    const focus = resolvePresentation('mothership', 'focus');
    expect(focus.tint).toBe('#1cff9a');
    expect(focus.ambientIntensity).toBe(0);
    expect(focus.motionBudget).toBe('off');
    expect(focus.surfaceHints.allowOverlay).toBe(false);

    const quiet = resolvePresentation('acid', 'quiet');
    expect(quiet.ambientIntensity).toBe(0);
    expect(quiet.surfaceHints.allowOverlay).toBe(false);
  });

  it('exposes pack outcome labels for comeback', () => {
    const packs: PackId[] = ['mothership', 'glitch', 'soft', 'root', 'acid'];
    for (const id of packs) {
      const p = resolvePresentation(id, 'comeback');
      expect(p.outcomeLabel).toBeTruthy();
      expect(p.surfaceHints.allowOverlay).toBe(true);
    }
  });

  it('collapses motion when reduceMotion is set', () => {
    const p = resolvePresentation('glitch', 'celebration', { reduceMotion: true });
    expect(p.motionBudget).toBe('off');
    expect(p.ambientIntensity).toBe(0);
  });
});

describe('pack registry compat', () => {
  it('accepts five pack ids including acid', () => {
    expect(isPackId('mothership')).toBe(true);
    expect(isPackId('neon')).toBe(false);
  });
});
