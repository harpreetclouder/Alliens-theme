# Work Progress — Orbital

## Status
v0.0.25 — Orbit gamification shipped (Tasks 1–8)  
Joy collage WIP (uncommitted)

## Orbit gamification (done)
- XP/level curve, calendar streak, achievements, daily mission, journey triggers
- Preview wins excluded from streak; `orbital.orbit.enabled` (default **true**) gates tracking
- **Panel HUD (idle):** Command **Orbital: Open Panel** → bottom **Orbital** tab when idle shows level, XP bar, streak, daily mission (paper/joy card). Refreshes on view resolve + after celebrations.
- **Status bar:** persistent `L{n} · 🔥{streak}` crumb (low priority); celebration whispers stay on a separate item
- Day-start check-in + pack-switch wins wired in engine

## Specs / plans
- Orbit: `docs/superpowers/specs/2026-09-13-orbital-orbit-gamification-design.md`, plan `docs/superpowers/plans/2026-09-13-orbital-orbit-gamification.md`
- Joy collage: `docs/superpowers/specs/2026-09-12-joy-collage-location-brain-design.md`

## Try Orbit
Reload window → ensure **Orbital › Orbit: enabled** → open panel (idle HUD) or glance status bar → trigger a win or **Preview Celebration** (preview does not extend streak)

## Try joy (WIP)
Region: `orbital.joy.region` · Preview from panel when joy lands
