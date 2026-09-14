# Work Progress — Orbital

## Status
v0.0.28 — SCM commit fix + **Verify Celebrations** harness + setup wizard

## Commit celebrations (SCM)
- Cursor often skips classic `onDidCommit`
- Now also listens to `onDidRunOperation` (Commit*) + SHA dedupe
- Output → Orbital: look for `Commit win detected`

## Agent / user verification
- Command: **Orbital: Verify Celebrations** — checks settings, git wire, fires preview + commit path, logs PASS/FAIL
- Command: **Orbital: Setup Wizard** — pack, intensity, commit surface, sound, orbit, Giphy key, optional verify

## Install
`orbital-0.0.28.vsix` packaged + installed (`orbital.orbital@0.0.28`); 115 tests pass
**Reload Window** → **Orbital: Setup Wizard** (or Verify Celebrations)
