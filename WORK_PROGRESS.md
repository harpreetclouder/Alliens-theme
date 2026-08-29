# Work Progress — Orbital

## Status
v1 implemented on `master` · kept as-is (GitHub setup deferred) · F5 smoke still recommended

## Done
- Spec + implementation plan
- Tasks 1–13 (themes, celebrations, SFX, engine, commands, onboarding, triggers, packaging)
- Final review fixes: SFX `enableScripts`, debug copy, phpunit regex, engine floor `^1.85.0`
- Artifact: `orbital-0.0.1.vsix`

## Try it
1. **Installed locally:** `orbital-0.0.1.vsix` → Cursor (reload window if needed)
2. **Demo guide:** `DEMO.md` — checklist to try all packs + preview commands
3. **Dev mode:** F5 → Extension Development Host (for iterating on code)
4. Commands: `Orbital: Preview Celebration`, `Switch Pack`, `Toggle Sound`

## Follow-ups
- Manual F5 matrix (onboarding, toast/overlay, triggers, SFX)
- Richer theme tokens
- Optional: tighten debug success detection

## Docs
- Spec: `docs/superpowers/specs/2026-08-29-orbital-design.md`
- Plan: `docs/superpowers/plans/2026-08-29-orbital-implementation.md`
- Ledger: `.superpowers/sdd/progress.md`
