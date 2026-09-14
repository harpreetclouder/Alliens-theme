# Work Progress — Orbital

## Status
v0.0.33 + **AI-native engineering layer** (agents/rules/skills/hooks/evals)

## AI engineering
- `AGENTS.md` · `.cursor/rules/00–50` · 5 subagents · skills (joy-brain retained)
- Hooks: risky shell guard · stop quality (compile/test/eval, loop_limit 1)
- `src/brain/` pure decisions · `npm run eval` (7/7 scenarios)
- Docs: `AI_ENGINEERING.md`, `MCP_SETUP.md`, `docs/adr/*`, `docs/specs/*`

## Evidence
- [orbital-verifier](b71f0526-1832-481c-b577-b5abafed2b25): **PARTIAL** (sandbox blocked scene bundle write)
- Parent follow-up writable: compile OK · **124** tests · eval **7/7** · secret-scan clean
- Still not live-proven this pass: `npm run package` + `ORBITAL_LIVE=1 npm run verify:release`
- Brain not yet wired into celebration triggers (intentional)

## Commit celebrations (prior)
Throttle no longer blocks commits; reflog fast path; `verify:commit-live` / `verify:release`
