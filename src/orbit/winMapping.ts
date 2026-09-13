import type { WinKind, WinSize } from '../celebrations/types';
import type { CelebrationSurface } from '../celebrations/surface';

/** Local calendar day YYYY-MM-DD for streak / mission keys. */
export function localDayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Preview never counts. Save counts when the win kind is save.
 * tests / build / commit / debug always count.
 */
export function countsForOrbitStreak(kind: WinKind): boolean {
  if (kind === 'preview') {
    return false;
  }
  if (kind === 'save') {
    return true;
  }
  return kind === 'tests' || kind === 'build' || kind === 'commit' || kind === 'debug';
}

/**
 * Map celebration size/surface → Orbit XP size.
 * Big classify wins stay big; panel → medium; overlay collage → big; statusbar → small.
 */
export function toOrbitWinSize(
  kind: WinKind,
  size: WinSize,
  surface: CelebrationSurface,
): 'small' | 'medium' | 'big' {
  if (size === 'big') {
    return 'big';
  }
  if (kind === 'tests' || kind === 'commit' || kind === 'preview') {
    return 'big';
  }
  if (surface === 'overlay') {
    return 'big';
  }
  if (surface === 'panel') {
    return 'medium';
  }
  if (surface === 'statusbar') {
    return 'small';
  }
  return 'small';
}
