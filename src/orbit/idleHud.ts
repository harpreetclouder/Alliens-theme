import {
  idleOrbitViewFromState,
  type IdleOrbitView,
} from '../celebrations/celebrationHtml';
import type { OrbitStore } from './store';

/** Idle Orbit HUD only when `orbital.orbit.enabled` is on. */
export function resolveIdleOrbit(
  orbitEnabled: boolean,
  store: OrbitStore | undefined,
): IdleOrbitView | undefined {
  if (!orbitEnabled || !store) {
    return undefined;
  }
  return idleOrbitViewFromState(store.load());
}
