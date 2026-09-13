import { Intensity } from '../config/settings';
import { WinKind, WinSize } from './types';

export function classifyKind(
  kind: WinKind,
  meta: { fullSuite?: boolean } = {},
): WinSize {
  if (kind === 'build' || kind === 'mission') return 'big';
  if (kind === 'tests' && meta.fullSuite) return 'big';
  return 'small';
}

export function resolveDisplay(
  kind: WinKind,
  size: WinSize,
  intensity: Intensity,
  celebrationIndex: number,
): 'toast' | 'overlay' {
  if (intensity === 'chill') {
    return 'toast';
  }
  if (kind === 'tests' || kind === 'preview') {
    return 'overlay';
  }
  if (size === 'big') {
    return 'overlay';
  }
  if (intensity === 'hype' && celebrationIndex % 3 === 0) {
    return 'overlay';
  }
  return 'toast';
}
