# Work Progress — Orbital

## Status
v0.0.17 — fix commit trigger (git API wiring + command fallback)

## Done
- v0.0.15 layered celebrations (terminal animation, status bar, streaks, surfaces)
- **v0.0.16 SFX:**
  - `media/sfx/mothership.wav` — beam uplink sweep
  - `media/sfx/glitch.wav` — static burst + digital ticks
  - `media/sfx/soft.wav` — cozy chime
  - `media/sfx/root.wav` — terminal double-beep
  - `npm run generate:sfx` to regenerate
  - `orbital.sound.enabled` default **true**
- **v0.0.17 commit fix:** robust git `onDidCommit` wiring (retries + `onDidChangeState`) + `git.commit*` command fallback; **Orbital: Preview Commit Celebration**

## Try it
1. **Reload window** after install
2. `npm test` — animated fullscreen in terminal + optional status bar streak
3. **Commit / build** — rich panel (GIFs) unless `intensity: chill`
4. Settings:
   - `orbital.celebrations.intensity`: `chill` | `normal` | `hype`
   - `orbital.celebrations.surfaces`: per-trigger overrides
   - `orbital.sound.enabled`: true for SFX
5. **Preview:** `Orbital: Preview Celebration`

## Follow-ups
- Manual F5 matrix (onboarding, toast/overlay, triggers, SFX)
- Richer theme tokens

## Docs
- Spec: `docs/superpowers/specs/2026-08-29-orbital-design.md`
- Plan: `docs/superpowers/plans/2026-08-29-orbital-implementation.md`
- Ledger: `.superpowers/sdd/progress.md`
