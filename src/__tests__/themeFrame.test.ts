import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runThemeScenario, type ThemeHarnessScenario } from '../theme/evalRunner';
import { resolveThemeFrame } from '../theme/themeFrame';
import { isCompletedChoreCommand } from '../triggers/taskSignals';

const dir = path.join(__dirname, '../../evals/theme');

describe('theme harness fixtures', () => {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

  it('covers the new win and quiet rules', () => {
    expect(files.length).toBeGreaterThanOrEqual(7);
    let failed = 0;
    for (const file of files) {
      const scenario = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')) as ThemeHarnessScenario;
      const result = runThemeScenario(scenario);
      if (!result.pass) {
        failed += 1;
      }
      expect(result.failures, scenario.id).toEqual([]);
    }
    expect(failed).toBe(0);
  });

  it('keeps the editor theme stable across packs for the same commit', () => {
    const packs = ['mothership', 'glitch', 'soft', 'root', 'acid'] as const;
    const themes = packs.map((packId) => {
      const frame = resolveThemeFrame({ packId, typing: false, quietMode: false, show: true });
      expect(Object.keys(frame.colorCustomizations).sort()).toEqual([
        'statusBar.background',
        'statusBar.foreground',
      ]);
      return frame.colorTheme;
    });
    expect(new Set(themes).size).toBe(packs.length);
  });

  it('does not treat push or test commands as chores', () => {
    expect(isCompletedChoreCommand('git push')).toBe(false);
    expect(isCompletedChoreCommand('npm test')).toBe(false);
    expect(isCompletedChoreCommand('npm run lint')).toBe(true);
  });
});
