---
name: orbital-feature
description: >-
  Standard workflow for implementing an Orbital feature. Use when adding or changing
  product behavior beyond a typo — celebrations, signals, settings, brain, packaging.
---

# Orbital feature workflow

1. Restate acceptance criteria (testable bullets)
2. Explore relevant `src/`, specs, ADRs
3. Identify reusable abstractions (do not duplicate)
4. Run baseline: `ORBITAL_SKIP_SIGNAL=1 npm test` (and `npm run eval` if brain/policy touched)
5. Cross-cutting? Invoke **orbital-architect** (readonly)
6. UX surface? Invoke **orbital-experience-designer** (readonly)
7. Write a short plan (files + test/eval updates)
8. Tests/scenarios first where decision logic changes
9. Implement smallest coherent change (core vs platform split)
10. `npm run compile`
11. `ORBITAL_SKIP_SIGNAL=1 npm test`
12. `npm run eval`
13. Privacy/network/webview? Invoke **orbital-privacy-reviewer**
14. Invoke **orbital-verifier** (separate context)
15. Update `WORK_PROGRESS.md` / spec if needed
16. Summarize evidence (commands + results)

Parallel writers → isolated worktrees. Tiny typo → skip this swarm.
