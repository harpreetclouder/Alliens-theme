# AI Engineering — Orbital

How to use Cursor agents, skills, hooks, and evals on this repo.

## Philosophy

```
SPEC → EXPLORE → PLAN → DELEGATE → IMPLEMENT → TEST → EVAL → INDEPENDENT VERIFY → DOCUMENT
```

Evidence over claims. See root `AGENTS.md`.

## Example: Add Orbital XO (substantial)

1. **Explore** existing celebrations / brain / webview patterns  
2. **Parallel readonly:** `orbital-architect` + `orbital-experience-designer`  
3. Parent writes `docs/specs/…-xo.md`  
4. **Implement:** platform engineer → webview/commands; main → domain rules in `src/brain` / pure modules  
5. Tests + `npm run eval`  
6. `orbital-privacy-reviewer` if webview/network  
7. **`orbital-verifier`** (separate context)  
8. `npm run package` · manual experience check · PR  

## Example: five unrelated bugs

Use **isolated worktrees/branches** + parallel workers. Do not share one dirty checkout.

## Example: tiny typo

Fix directly. **Do not** spawn five subagents.

## Example: refactor signal engine + 12 scenario tests

- Sequential or worktree-split: one writer for engine, one for `evals/scenarios`  
- Cloud Agent OK for the large test-addition branch  

## Example: reject bad telemetry

Request: “send terminal command text to our server” → **`orbital-privacy-reviewer` + rule 30** → **Block / Redesign**.

## Hooks

| Hook | Behavior |
|------|----------|
| `beforeShellExecution` | Denies force-push, `reset --hard`, dangerous `rm -rf`, `npm/vsce/ovsx publish` |
| `stop` (loop_limit 1) | If product TS dirty, runs compile + test + eval once |

Secret scan: `node .cursor/hooks/secret-scan.mjs` (also in release skill).

## Commands

```bash
npm run compile
ORBITAL_SKIP_SIGNAL=1 npm test
npm run eval
npm run package
ORBITAL_LIVE=1 npm run verify:release   # after install + Reload
```

## Content generation (offline)

AI may draft curiosity cards / jokes **offline** into versioned JSON with schema review (`docs/specs/content-schema.md`). Runtime Core uses `LocalRuleBasedProvider` — **no required AI API**.

## Cloud Agents

Use for long independent PR-ready work, CI fixes, large eval suites — not one-line edits.
