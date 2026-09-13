# Work Progress — Orbital

## Status
v0.0.26 — Joy collage + locale brain shipped  
**Next:** Orbital Orbit Task 5 (day-start check-in)

## Orbit gamification (in progress)
- Task 1 done: `src/orbit/types.ts`, `src/orbit/rules.ts`, tests (XP/level/streak helpers)
- Task 2 done: `src/orbit/store.ts`, `src/__tests__/orbitStore.test.ts` (globalState load/save, applyWin)
- Task 3 done (review **Approved**): `ensureMission` / `progressMission`, `applyWin` mission bonus +40, `mission-complete` achievement; injectable `random` on `OrbitStore` fixes flaky 80 XP test
- Task 4 done: CelebrationEngine → OrbitStore (`applyWin` + `await save`); `orbital.orbit.enabled`; follow-ups via `host.show` only (no re-applyWin); streak passed when > 1

## Specs / plans
- Joy collage: `docs/superpowers/specs/2026-09-12-joy-collage-location-brain-design.md`
- Orbit gamification: `docs/superpowers/specs/2026-09-13-orbital-orbit-gamification-design.md`
- Plan: `docs/superpowers/plans/2026-09-13-orbital-orbit-gamification.md`

## Try joy (current)
Reload → Preview Celebration  
Optional Tenor: Settings → `orbital.tenor.apiKey`  
Region: `orbital.joy.region`
