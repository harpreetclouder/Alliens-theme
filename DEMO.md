# Orbital — Local Demo Checklist

Use this to try Orbital in Cursor and decide what to change before v1.1.

## Option A — Fastest (Extension Development Host)

Best for testing while you iterate on code.

1. Open **this folder** in Cursor: `/Users/macbook/Desktop/Aliens theme`
2. Run `npm install` once if you haven't
3. Press **F5** (or Run and Debug → **Run Orbital Extension**)
4. A **new Cursor window** opens — that's the demo. Use that window, not your original one.

## Option B — Install like a real user (VSIX)

Use your normal Cursor window.

1. **Extensions** sidebar → **⋯** (top) → **Install from VSIX…**
2. Pick: `/Users/macbook/Desktop/Aliens theme/orbital-0.0.1.vsix`
3. Reload when prompted

---

## Demo flow (~10 min)

### 1. First-run onboarding
- On first activate: pick a pack (try all four over time)
- Say **Yes** to sound once so you can hear pack SFX

### 2. Preview celebrations (no tasks needed)
Command Palette (`Cmd+Shift+P`):

| Command | What to check |
|---|---|
| **Orbital: Preview Celebration** | Toast/overlay animation, caption, pack vibe |
| **Orbital: Switch Pack** | Theme + pack change together |
| **Orbital: Toggle Sound** | SFX on/off |

Run **Preview** 3–4 times — you should see different loops (pack + random library).

### 3. Try all four packs

| Pack | Theme | Vibe |
|---|---|---|
| Mothership OS | Green HUD / beam | Sci-fi tractor beam |
| Glitch Transmission | Amber / stamp | VHS meme energy |
| Soft Abduction | Peach / dreamcore | Chill toast |
| Root Access | Terminal green | Hacker `sudo celebrate` |

**Preferences: Color Theme** → pick each **Orbital — …** theme.

### 4. Intensity settings
Settings → search `orbital.celebrations.intensity`:

- **chill** — toast only
- **normal** — hybrid (big overlay on build-style wins)
- **hype** — more overlays

Preview after each change.

### 5. Trigger a real win (optional)
- **Terminal:** run `npm test` in the integrated terminal (now detected in v0.0.2+)
- **Commit** something in a git repo → small celebration (if trigger on)
- **Run a VS Code task** named `test` or `build` with exit 0
- **Save file** — only if you enable `orbital.celebrations.triggers.save`

**Debug:** View → Output → **Orbital** — logs when celebrations fire or get skipped.

---

## What to note for feedback

When something feels off, tell me:

1. **Pack** (Mothership / Glitch / Soft / Root)
2. **What happened** (preview, commit, test, etc.)
3. **Change you want** (colors, animation, caption text, less/more motion, sound)

Example: *"Glitch stamp is too fast — slow overlay to 3s"* or *"Root theme needs more purple accent"*

---

## Reset first-run (try onboarding again)

Command Palette → **Developer: Open Extension Storage** is heavy; easier:

1. Uninstall Orbital extension
2. Reinstall VSIX or F5 again

Or in Extension Development Host only: clear global state via **Developer: Toggle Developer Tools** → Application → Extension storage (advanced).

---

## Rebuild after changes

```bash
npm run compile
npm run package   # new orbital-0.0.1.vsix
```

Then reinstall VSIX or reload F5 window.
