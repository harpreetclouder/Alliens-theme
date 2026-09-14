# Work Progress — Orbital

## Status
v0.0.30 — **agent verify trail** (`npm run verify:agent`)

## Agent / terminal verification
1. Install latest VSIX + **Reload Window**
2. `npm run verify:agent`
3. Extension watches `.vscode/orbital-verify-request.json`, runs harness (preview + commit path + settings/git-wire), writes `.vscode/orbital-verify-result.json`
4. Script exits 0 on PASS / 1 on FAIL or timeout

## SCM commit (0.0.29+)
`state.onDidChange` + reflog `commit:` — push alone does **not** celebrate

## Package workflow
`npm run package` → install → Reload → `npm run verify:agent`
