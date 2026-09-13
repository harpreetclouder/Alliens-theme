# Work Progress — Orbital

## Status
v0.0.27 — persistent status-bar level crumb `$(rocket) L{n} · 🔥{streak}`

## Why level was missing
Installed 0.0.26 build lacked Orbit status-bar crumb (old whisper-only StatusBar). Workspace had Orbit; Cursor was still on the earlier 0.0.26 package.

## Fix
- Reinstall **0.0.27**
- Reload window
- Status bar (right): rocket + `L1 · 🔥0` (updates on wins)
- Setting: `orbital.orbit.enabled` (default on)
- Output → Orbital → `Orbit crumb — L…`
