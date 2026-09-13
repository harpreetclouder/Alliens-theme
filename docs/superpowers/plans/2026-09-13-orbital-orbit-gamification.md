# Orbital Orbit Gamification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add layered IDE-journey celebrations plus XP, calendar streaks, achievements, and daily missions (“Orbital Orbit”), with memorable big wins and quiet small wins.

**Architecture:** New `src/orbit/` store + rules persist in `globalState`. `CelebrationEngine` records real wins into Orbit, may enqueue follow-up celebrations (level-up, milestone, achievement coalesce). Panel idle HTML shows progress. Existing triggers stay; save stays opt-in.

**Tech Stack:** VS Code extension API (`globalState`), TypeScript, Vitest, existing joy collage / statusbar / panel.

## Global Constraints

- Layered intensity only (A): small → statusbar, medium → panel, big → collage/terminal-native
- Preview never counts toward calendar streak
- No leaderboards, fail-shaming, or GPS
- Persist key: `orbital.orbit.v1`
- Level: `floor(sqrt(xp / 50)) + 1`
- XP: small 5 / medium 25 / big 80; mission bonus +40
- Streak milestones: 3, 7, 14, 30
- Version bump when packaging; update `WORK_PROGRESS.md` after changes
- Do not edit the plan file in `.cursor/plans/`

---

### Task 1: Orbit types + pure XP/level/streak helpers

**Files:**
- Create: `src/orbit/types.ts`
- Create: `src/orbit/rules.ts`
- Test: `src/__tests__/orbitRules.test.ts`

**Interfaces:**
- Produces: `OrbitState`, `emptyOrbitState()`, `levelFromXp(xp: number): number`, `xpForSize(size: 'small' | 'medium' | 'big'): number`, `nextStreak(state, dayKey, countsForStreak): { streakDays, lastWinDay, milestone?: number }`, `MISSION_POOL`, `ACHIEVEMENTS`

- [ ] **Step 1: Write failing tests** for `levelFromXp` (0→1, 50→2, 200→3), `xpForSize`, streak consecutive vs broken day, milestone at 7

- [ ] **Step 2: Run** `npx vitest run src/__tests__/orbitRules.test.ts` — expect FAIL

- [ ] **Step 3: Implement** `types.ts` + `rules.ts` with formulas from spec

- [ ] **Step 4: Run tests** — expect PASS

---

### Task 2: OrbitStore (globalState)

**Files:**
- Create: `src/orbit/store.ts`
- Test: `src/__tests__/orbitStore.test.ts`

**Interfaces:**
- Consumes: `OrbitState`, rules helpers
- Produces: `class OrbitStore { constructor(globalState: { get, update }); load(): OrbitState; async save(s): void; applyWin(input): OrbitWinResult }`
- `OrbitWinResult`: `{ state, xpGained, leveledUp, previousLevel, milestone?, unlocked: string[], missionCompleted: boolean }`

```ts
export interface ApplyWinInput {
  dayKey: string; // local YYYY-MM-DD
  size: 'small' | 'medium' | 'big';
  kind: string;
  countsForStreak: boolean;
  regionId?: string;
}
```

- [ ] **Step 1: Failing tests** — apply big tests win unlocks `green-suite` + `first-liftoff`, awards 80 XP, bumps streak; preview with `countsForStreak: false` does not bump streak; second win same day does not double streak days

- [ ] **Step 2: Implement store** with in-memory fake globalState in tests

- [ ] **Step 3: Tests PASS**

---

### Task 3: Daily mission roll + progress

**Files:**
- Modify: `src/orbit/rules.ts`, `src/orbit/store.ts`
- Test: extend `orbitStore.test.ts` / `orbitRules.test.ts`

**Interfaces:**
- Produces: `ensureMission(state, dayKey, random): OrbitState`, `progressMission(state, kind, xpGained): { state, completed: boolean }`

Mission ids v1:
- `commit-1` target 1 kind commit
- `tests-1` target 1 kind tests  
- `xp-50` target 50 XP gained today (track `mission.progress`)

- [ ] **Step 1: Tests** for ensureMission once per day; commit win completes `commit-1`

- [ ] **Step 2: Implement**

- [ ] **Step 3: PASS**

---

### Task 4: Wire CelebrationEngine → Orbit

**Files:**
- Modify: `src/celebrations/engine.ts`
- Modify: `src/celebrations/classifier.ts` (if needed for medium size)
- Modify: `src/extension.ts` — construct `OrbitStore`, pass into engine
- Modify: `src/config/settings.ts` + `package.json` — `orbital.orbit.enabled` default true

**Interfaces:**
- Consumes: `OrbitStore.applyWin`
- After each successful celebration path (not skip/throttle), call applyWin
- `countsForStreak`: false for `preview`; true for tests/build/commit/debug; true for save only if kind===save
- If `leveledUp` or `milestone` or `missionCompleted` or new `unlocked.length`: schedule follow-up via `host.show` with appropriate surface (medium panel / big collage) and caption from orbit copy helpers — coalesce unlocked into one medium show
- Pass `streak: state.streakDays` into host when > 1

- [ ] **Step 1: Add setting** `orbital.orbit.enabled`

- [ ] **Step 2: Wire store into engine**; if disabled, skip orbit

- [ ] **Step 3: Manual sanity** — Preview does not increase streakDays in globalState

- [ ] **Step 4: Unit test** engine orbit integration with mocks if feasible; else store tests suffice + compile

---

### Task 5: Day-start check-in + pack-switch small win

**Files:**
- Create: `src/orbit/dayStart.ts`
- Modify: `src/extension.ts`
- Modify: `src/commands/registerCommands.ts` (pack switch)

**Interfaces:**
- Produces: `maybeDayStart(context, store, host, settings): void` — if new local day since `lastCheckInDay` in globalState `orbital.orbit.checkInDay`, roll mission, statusbar whisper, XP small once

- [ ] **Step 1: Implement day start** on activate (after settings read)

- [ ] **Step 2: On pack switch success**, `engine.handle` small or direct statusbar + applyWin small (kind `preview` must NOT be used — add kind `checkin` | `pack` to WinKind)

**WinKind expansion:** add `'checkin' | 'pack' | 'levelup' | 'achievement' | 'mission'` to `src/celebrations/types.ts` and update surfaces/captions/bites matching (`*` kinds ok), classifier sizes, settings triggers optional (checkin/pack always soft).

- [ ] **Step 3: Update** `DEFAULT_SURFACES`, captions stubs, library `*` still matches

- [ ] **Step 4: Compile + tests**

---

### Task 6: Panel idle Orbit HUD

**Files:**
- Modify: `src/celebrations/celebrationHtml.ts` — `buildIdlePanelHtml(csp, css, orbit?: IdleOrbitView)`
- Modify: `src/celebrations/panelView.ts` — pass orbit snapshot
- Modify: `media/webview/celebration.css` — idle orbit bar styles (paper/joy, not neon)

**Interfaces:**
- `IdleOrbitView { level, xp, xpToNext, streakDays, missionLabel, missionProgress, missionTarget }`

- [ ] **Step 1: Extend idle HTML** with level/streak/mission

- [ ] **Step 2: Refresh idle** after celebrations finish and on resolveWebviewView

- [ ] **Step 3: CSS** compact joy card

---

### Task 7: Status bar level crumb (optional companion)

**Files:**
- Modify: `src/celebrations/statusBar.ts`
- Modify: host/engine to set persistent status bar item text `L{n} · 🔥{streak}` when orbit enabled (low priority item)

- [ ] **Step 1: Persistent Orbit status item** updated after applyWin

- [ ] **Step 2: Whisper celebrations** still use temporary item or same item briefly

---

### Task 8: Verify + docs

**Files:**
- Modify: `WORK_PROGRESS.md`
- Modify: `package.json` version → `0.0.25`

- [ ] **Step 1: `ORBITAL_SKIP_SIGNAL=1 npm test` && `npm run compile`** — all pass

- [ ] **Step 2: Update WORK_PROGRESS** with Orbit summary + how to see panel HUD / streak

- [ ] **Step 3: Do not commit** unless user asks

---

## Spec coverage check

| Spec item | Task |
|-----------|------|
| XP / level curve | 1–2 |
| Calendar streak + milestones | 1–2, 4 |
| Achievements | 2, 4 |
| Daily mission | 3–4 |
| Journey triggers layered | 4–5 |
| Preview excluded from streak | 4 |
| Panel idle HUD | 6 |
| Settings orbit.enabled | 4 |
| No leaderboards | (omitted) |
