# AGENTS.md — Orbital

Orbital is a **privacy-first Developer Intermission Engine** (themes + finite celebrations / micro-experiences for Cursor & VS Code).

## Primary principle

**Right experience + right moment + right duration + right personality.**

## Product constraints

- Never interfere with developer flow unnecessarily
- Local-first; no raw source-code collection; no raw terminal-history persistence
- Minimal dependencies; package stays lightweight
- VS Code/Cursor APIs stay at the edge — core logic is pure/testable where practical
- Experiences are **finite** (clear duration, skip, easy return) — no feeds, no manipulative loops
- Accessible UI; existing functionality must not regress

## Engineering loop

```
SPEC → EXPLORE → PLAN → DELEGATE → IMPLEMENT → TEST → EVAL → INDEPENDENT VERIFY → DOCUMENT
```

Never: prompt → dump code → claim done. **Evidence required** (commands + results).

## Stack

- TypeScript **strict** (`tsconfig.json`)
- Vitest unit tests · `npm run eval` scenario harness · `npm run package` release gate
- Inject clock/random/storage/content in new core logic

## Agent coordination (substantial features)

| Role | When |
|------|------|
| Explore (built-in) | Always first for unfamiliar areas |
| `orbital-architect` | New signals, brain/scheduling, persistence, external APIs, platform boundaries |
| `orbital-experience-designer` | Games, celebrations, onboarding, interruption UX |
| `orbital-platform-engineer` | VS Code APIs, webviews, SCM, activation, VSIX |
| Main agent | Core/domain logic + plan ownership |
| `orbital-privacy-reviewer` | Terminal/editor/FS/network/webview/keys/MCP |
| `orbital-verifier` | **Always** after meaningful implementation (separate context) |

- Parallel **readonly** reviews OK; parallel **writers** → isolated git worktrees/branches
- Tiny typos → no subagent swarm
- Cloud Agents → long independent/PR-ready work only

## Skills

- `orbital-feature` — standard feature workflow
- `orbital-experience` — new micro-experience contract
- `orbital-signal` — new workflow signal
- `orbital-release-gate` — compile/test/eval/package checklist
- `orbital-joy-brain` — locale GIF/meme content (retain)

## Docs

- `docs/AI_ENGINEERING.md` — how to work here
- `docs/MCP_SETUP.md` — engineering MCP only (not runtime)
- `docs/specs/` · `docs/adr/` · `evals/scenarios/`

## Done means

Compile + tests + evals green (when touched) · verifier PASS/PARTIAL with evidence · docs/WORK_PROGRESS updated · no secrets committed.
