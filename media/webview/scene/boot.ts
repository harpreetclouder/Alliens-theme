import { SceneRuntime } from './runtime';
import type { SceneBootPayload } from './types';

function boot(): void {
  const payload = window.__ORBITAL_SCENE__;
  if (!payload) {
    console.warn('[orbital-scene] missing window.__ORBITAL_SCENE__');
    return;
  }

  const root = document.getElementById('scene-root');
  if (!root) {
    console.warn('[orbital-scene] missing #scene-root');
    return;
  }

  document.body.classList.add('scene-engine');
  if (payload.surface === 'panel') {
    document.body.classList.add('scene-panel');
  } else {
    document.body.classList.add('scene-overlay');
  }

  const runtime = new SceneRuntime(root, payload as SceneBootPayload);
  runtime.startScene();

  window.addEventListener(
    'pagehide',
    () => {
      runtime.dispose();
    },
    { once: true },
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
