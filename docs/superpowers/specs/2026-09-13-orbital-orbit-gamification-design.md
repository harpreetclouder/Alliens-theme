# Orbital Orbit — Layered Journey + Gamification Design

**Date:** 2026-09-13  
**Status:** Approved  
**Scope:** Cover the full IDE win journey with layered celebrations; add XP, calendar streaks, achievements, daily missions. No leaderboards, no fail-shaming, no paywalls.

## Goal

Make Orbital memorable across a normal developer day: quiet encouragement for small wins, full joy collage for big wins, and persistent progress (level / streak / missions) that makes people want to come back — without noise fatigue.

## Intensity model (Layered = A)

| Size | Examples | Surface (normal) | XP |
|------|----------|------------------|-----|
| small | daily check-in, meaningful save (opt-in), pack switch | statusbar whisper | 5 |
| medium | debug end, achievement unlock, build | panel joy card | 25 |
| big | tests, commit, streak milestone 3/7/14/30, daily mission complete | collage (or terminal for test-native) | 80 |

**Chill:** statusbar + XP only.  
**Hype:** medium wins may upgrade to collage.  
**Throttle:** small ≤1 / 45s; big never blocked; multiple achievements coalesce into one medium show.

## Journey coverage

| Moment | Trigger | Default | Notes |
|--------|---------|---------|-------|
| Day start | activate + new calendar day | on | statusbar “mission briefing” + daily mission roll |
| Save | `onDidSaveTextDocument` | **off** | meaningful only (skip untitled / non-workspace); throttled |
| Tests | existing | on | big |
| Build | existing | on | medium→big by classifier |
| Commit | existing | on | big |
| Debug end | existing | on | medium |
| Pack switch | command | on | small |
| Streak milestone | Orbit store | on | big collage |
| Achievement | Orbit store | on | medium (coalesced) |
| Daily mission done | Orbit store | on | big + bonus XP |
| Preview | command | on | big; **does not** count toward calendar streak |
| Push / PR | deferred v1.5 | off | stub only if API clean |

Never celebrate: keystrokes, focus churn, failed tests as joy.

## Gamification — “Orbital Orbit”

Persist in `ExtensionContext.globalState` key `orbital.orbit.v1`:

```ts
{
  xp: number;
  level: number;          // derived from xp
  lastWinDay: string;     // YYYY-MM-DD UTC or local — use local
  streakDays: number;     // consecutive calendar days with ≥1 real win
  unlocked: string[];     // achievement ids
  mission: {
    id: string;
    day: string;
    progress: number;
    target: number;
    completed: boolean;
  } | null;
}
```

### Level curve
`level = floor(sqrt(xp / 50)) + 1` (soft early levels).  
Level-up → medium celebration once per level.

### Achievements (v1 set)
- `first-liftoff` — first celebration ever  
- `green-suite` — tests win  
- `commit-comet` — commit win  
- `week-orbit` — 7-day streak  
- `debug-dodge` — debug end  
- `mission-complete` — finish a daily mission  
- `region-scout` — celebration while non-global region resolved  

### Daily missions (one per day)
Examples: “Ship 1 commit”, “Green tests once”, “Earn 50 XP”.  
Rolled at day start from a small pool. Bonus +40 XP on complete.

### Calendar streak
Bump when a **real** win fires (tests/build/commit/debug/mission — not preview-only, not save-only unless save is the only win that day — prefer: preview never counts; save counts only if trigger enabled and no other win that day is required — **spec: preview never counts; save counts if enabled**).

Milestones at 3, 7, 14, 30 → big collage.

## UI

- **Panel idle:** level, XP bar, streak, today’s mission (paper/joy tone — not neon dashboard).  
- **Statusbar:** whisper text + optional `$(rocket) L3 · 🔥5`.  
- **Collage:** unchanged joy collage for big wins; may show “Level up” / “Mission clear” as caption/subline when those events drive the show.

## Settings

- Existing intensity + per-kind triggers  
- `orbital.orbit.enabled` (default true)  
- Keep save default false  

## Out of scope
Leaderboards, social, punitive fails, monetized XP, push/PR hard requirement in v1.

## Success criteria
- Developer can feel progress after a normal day of tests + commits  
- Small wins never spam overlay  
- Streak/mission survive reload (globalState)  
- Tests cover XP/level, streak day logic, achievement unlock, mission progress  
