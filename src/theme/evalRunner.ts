import { decideWinMoment, type WinMomentContext } from '../brain/winMoment';
import type { PackId } from '../packs/types';
import {
  PERIPHERAL_THEME_KEYS,
  themeFrameForMoment,
  type ThemeFrame,
} from './themeFrame';
import { getExperiencePack } from '../packs/experiencePacks';
import type { WinMomentDecision } from '../brain/winMoment';

export interface ThemeHarnessScenario {
  id: string;
  packId: PackId;
  win: WinMomentContext;
  expect: {
    show: boolean;
    /** null means the moment must not force a surface. */
    forceSurface?: 'statusbar' | 'overlay' | null;
    colorTheme: string;
    tint: boolean;
  };
}

export interface ThemeHarnessResult {
  id: string;
  pass: boolean;
  failures: string[];
  moment: WinMomentDecision;
  frame: ThemeFrame;
}

const ALLOWED = new Set<string>(PERIPHERAL_THEME_KEYS);

export function runThemeScenario(scenario: ThemeHarnessScenario): ThemeHarnessResult {
  const moment = decideWinMoment(scenario.win);
  const frame = themeFrameForMoment(scenario.packId, moment, {
    typing: scenario.win.typing,
    quietMode: scenario.win.quietMode,
  });
  const failures: string[] = [];
  const exp = scenario.expect;
  const packLabel = getExperiencePack(scenario.packId).themeLabel;

  if (moment.show !== exp.show) {
    failures.push(`show=${moment.show} expected ${exp.show}`);
  }
  if (exp.forceSurface !== undefined) {
    const actual = moment.forceSurface ?? null;
    if (actual !== exp.forceSurface) {
      failures.push(`forceSurface=${String(actual)} expected ${String(exp.forceSurface)}`);
    }
  }
  if (frame.colorTheme !== exp.colorTheme) {
    failures.push(`colorTheme=${frame.colorTheme} expected ${exp.colorTheme}`);
  }
  if (frame.colorTheme !== packLabel) {
    failures.push(`colorTheme drifted from pack label ${packLabel}`);
  }
  if (frame.lockEditorTheme !== true) {
    failures.push('editor theme must stay locked');
  }

  const keys = Object.keys(frame.colorCustomizations);
  for (const key of keys) {
    if (!ALLOWED.has(key) || key.startsWith('editor') || key.includes('token')) {
      failures.push(`forbidden theme key ${key}`);
    }
  }
  if (exp.tint && keys.length === 0) {
    failures.push('expected status bar tint');
  }
  if (!exp.tint && keys.length > 0) {
    failures.push(`expected no tint, got ${keys.join(',')}`);
  }

  return { id: scenario.id, pass: failures.length === 0, failures, moment, frame };
}
