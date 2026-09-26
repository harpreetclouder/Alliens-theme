import type { OutcomeId } from '../brain/types';
import type { WinKind } from '../celebrations/types';
import { resolvePresentation, type PresentationPrefs } from './presentation';
import type { PackId, PresentationResolved, VisualState } from './types';
import { resolveVisualState } from './visualState';

/** Map celebration win kinds → brain-ish outcomes for presentation only. */
export function winKindToOutcome(kind: WinKind): OutcomeId {
  switch (kind) {
    case 'checkin':
      return 'comeback';
    case 'pack':
      return 'statusbar';
    case 'save':
    case 'task':
      return 'statusbar';
    case 'debug':
      return 'statusbar';
    default:
      return 'celebration';
  }
}

export function presentationForWin(
  packId: PackId,
  kind: WinKind,
  prefs: PresentationPrefs = {},
): PresentationResolved {
  const outcome = winKindToOutcome(kind);
  const visualState: VisualState = resolveVisualState({
    outcome: outcome === 'statusbar' ? null : outcome,
    waiting: false,
    quietMode: prefs.quietMode,
    typing: prefs.typing,
  });
  // statusbar-ish wins still get normal chrome unless quiet/focus
  const state =
    outcome === 'statusbar' && visualState === 'normal' ? 'normal' : visualState;
  return resolvePresentation(packId, state === 'normal' && kind === 'checkin' ? 'comeback' : state, prefs);
}

/** Prefer pack outcome label for identity beats; keep variety for tests/preview. */
export function resolveCaption(
  kind: WinKind,
  presentation: PresentationResolved,
  pickedLine: string,
): string {
  if (
    presentation.outcomeLabel &&
    (kind === 'commit' || kind === 'checkin' || kind === 'build' || kind === 'mission')
  ) {
    return presentation.outcomeLabel;
  }
  return pickedLine;
}
