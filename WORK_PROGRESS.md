# Work Progress — Orbital

## Status
v0.0.29 — SCM commit via **state.onDidChange + reflog** (Cursor-reliable)

## Why SCM still failed on 0.0.28
- Public `vscode.git` API does **not** expose `onDidRunOperation` (internal only)
- Cursor often never fires `onDidCommit` for Source Control commits
- So 0.0.28 wired hooks that never ran

## Fix (0.0.29)
- Keep onDidCommit / onDidRunOperation when present
- Add `state.onDidChange` → read `.git/logs/HEAD` → celebrate only if last line is `commit:` / `commit (amend):` …
- Pull/checkout/reset ignored; SHA dedupe avoids double-fire

## Verify
Reload → Output → Orbital: `Git repo wired` should list `state.onDidChange=true`
SCM commit → `Commit win detected` with `state.onDidChange+reflog`
Or run **Orbital: Verify Celebrations**
