# Orbital

Orbital is an alien/UFO theme and celebration companion for Cursor and VS Code — swap editor color packs and trigger pack-matched celebrations on dev milestones.

## Install

### From source (development)

1. Clone this repo and run `npm install`.
2. Press **F5** (or **Run → Start Debugging** with **Run Orbital Extension**) to open an Extension Development Host with Orbital loaded.
3. On first launch, a QuickPick walks you through picking a pack and optional sound.

### From `.vsix`

1. Build the package: `npm run package` (or `npx vsce package`).
2. In Cursor/VS Code: **Extensions** → **⋯** menu → **Install from VSIX…** → select `orbital-0.0.1.vsix`.

## Pick a theme

Orbital ships four color themes — one per pack:

| Pack ID | Theme label | Feel |
|---|---|---|
| `mothership` | Orbital — Mothership OS | Bioluminescent spacecraft HUD |
| `glitch` | Orbital — Glitch Transmission | VHS / amber grit / meme stamp |
| `soft` | Orbital — Soft Abduction | Dreamcore peach / calm dopamine |
| `root` | Orbital — Root Access | Black-site terminal / hacker |

**Command Palette** → **Preferences: Color Theme** → choose an **Orbital — …** theme.

Or run **Orbital: Switch Pack** to change pack, theme, and celebration personality together.

## Celebrations

When enabled, Orbital celebrates real dev wins with pack-matched CSS loops and short captions:

- **Small wins** → corner toast (~1.5s)
- **Big wins** → full-editor overlay (~2–2.5s)
- Throttled to ~1 celebration per 45 seconds
- Respects **reduce motion** (`auto` follows OS)

Default triggers: tests pass, build succeed, git commit, debug session end. File save is off by default.

## Sound (optional)

Sound is **off by default**. Enable via **Orbital: Toggle Sound**, first-run prompt, or `orbital.sound.enabled`. Each pack has a short SFX; mute individual packs with `orbital.sound.mutedPacks`.

## Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `orbital.pack` | `mothership` \| `glitch` \| `soft` \| `root` | `mothership` | Active celebration pack and theme family |
| `orbital.celebrations.enabled` | boolean | `true` | Enable celebration overlays and toasts |
| `orbital.celebrations.intensity` | `chill` \| `normal` \| `hype` | `normal` | `chill` = toast-only; `normal` = hybrid; `hype` = more overlays |
| `orbital.celebrations.triggers.tests` | boolean | `true` | Celebrate when tests pass |
| `orbital.celebrations.triggers.build` | boolean | `true` | Celebrate on successful build |
| `orbital.celebrations.triggers.commit` | boolean | `true` | Celebrate on commit |
| `orbital.celebrations.triggers.debug` | boolean | `true` | Celebrate when a debug session ends |
| `orbital.celebrations.triggers.save` | boolean | `false` | Celebrate on file save |
| `orbital.sound.enabled` | boolean | `false` | Play pack SFX during celebrations |
| `orbital.sound.mutedPacks` | string[] | `[]` | Packs whose SFX are muted |
| `orbital.reduceMotion` | `auto` \| `always` \| `never` | `auto` | Reduce celebration motion (`auto` follows OS) |

## Commands

| Command | Description |
|---|---|
| **Orbital: Switch Pack** | QuickPick to change active pack and matching color theme |
| **Orbital: Preview Celebration** | Trigger a sample celebration for the current pack |
| **Orbital: Toggle Sound** | Flip `orbital.sound.enabled` |

## Design spec

Full product and architecture details: [docs/superpowers/specs/2026-08-29-orbital-design.md](docs/superpowers/specs/2026-08-29-orbital-design.md).

## Development

```bash
npm install
npm run compile   # TypeScript → out/
npm test          # vitest
npm run package   # build orbital-0.0.1.vsix
```
