# Orbital Scene Framework — Design

**Date:** 2026-09-12  
**Status:** Approved  
**Scope:** WebGL cinematic celebration runtime for overlay + panel. Terminal and statusbar unchanged.

## Goal

Replace toast/HUD-style webview celebrations with a **scene framework**: Three.js world + timeline choreography + kinetic typography, so overlay and panel feel like a 2050 engagement layer, not a plugin card.

## Surfaces

| Surface | Behavior |
|---------|----------|
| overlay | Full-viewport WebGL scene |
| panel | Same scene, framing tuned for shorter viewport |
| terminal | ANSI / existing scripts only — no WebGL |
| statusbar | Text-only — no WebGL |

## Stack

- Three.js (bundled, no CDN)
- Custom timeline (no GSAP)
- esbuild → `media/webview/scene.bundle.js` (IIFE)
- Extension host remains `tsc` only

## Architecture

1. `CelebrationEngine` resolves surface, caption, pack, duration.
2. `CelebrationHost` / `CelebrationPanelProvider` inject HTML with scene script URI + boot payload.
3. Webview loads `scene.bundle.js`, reads `window.__ORBITAL_SCENE__`, mounts `#scene-root`.
4. `SceneRuntime` owns RAF, resize, dispose; drives camera + fog + particles via timeline.
5. Kinetic caption lives in DOM `#hud` synced to timeline beats.

## Boot payload

```ts
{
  pack: string;
  caption: string;
  subline?: string;
  tint: string;
  durationMs: number;
  exitLeadMs: number;
  reduceMotion: boolean;
  surface: 'overlay' | 'panel';
  gifUri?: string;
  emoji?: string;
  tone?: string;
}
```

## World model (v1)

One shared **Orbital Space** scene. Packs supply palette, fog density, particle tint, and accent motion. Acid uses scrapbook-tinted particles. No separate Three engines per pack in v1.

## Duration

Scene-backed overlay/panel: **9000ms**. Exit lead: **1000ms**.

## reduceMotion

Skip WebGL. DOM HUD + static caption only (`scene-fallback` body class).

## CSP

`script-src ${cspSource} 'unsafe-inline'` so the local bundle can load. No workers / WASM / CDN in v1.

## Out of scope (v1)

- Terminal WebGL
- Scroll-jacked multi-chapter sites
- Per-pack separate worlds
- CDN / workers / WASM
