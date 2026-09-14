---
name: orbital-release-gate
description: >-
  Release readiness for Orbital VSIX. Use before packaging claims or version bumps.
  Runs compile, tests, evals, hard commit-detect, package checklist; never auto-publish.
---

# Orbital release gate

## Offline (required)

```bash
npm run compile
ORBITAL_SKIP_SIGNAL=1 npm test
npm run eval
npm run verify:commit-detect   # or full: npm run package
npm run package                # includes hard commit-detect
```

## Live (after install + Reload)

```bash
ORBITAL_LIVE=1 npm run verify:release
```

## Checklist

- [ ] Version in `package.json` bumped intentionally
- [ ] No secrets in diff
- [ ] Dependency review (no heavyweight surprise deps)
- [ ] Privacy: no new raw source/terminal export
- [ ] `orbital-verifier` PASS or explicit PARTIAL with follow-ups
- [ ] Agent never runs `npm publish` / `vsce publish` / `ovsx publish`

## Output

Release checklist with command results. Block publish commands — humans only.
