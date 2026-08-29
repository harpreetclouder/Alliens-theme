# Orbital v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single Cursor/VS Code extension named Orbital with four alien color packs plus hybrid smile-first celebrations (pack loops + random library), optional pack SFX, and configurable win triggers.

**Architecture:** One TypeScript extension: theme JSON contributions for four packs; a celebration engine (throttle → classify → pick loop → webview host → optional SFX); event bridges for tests/build/git/debug/save; settings + commands + first-run pack picker. Pure logic is unit-tested with Vitest; webview + activation verified manually in Extension Development Host.

**Tech Stack:** TypeScript, VS Code Extension API (`engines.vscode` `^1.85.0`), Vitest, `@types/vscode`, `vsce`/`@vscode/vsce` for packaging, CSS celebration loops (no heavy GIF dumps), short WAV/MP3 pack SFX.

## Global Constraints

- Product name: **Orbital**; settings namespace: `orbital.*`
- Pack IDs only: `mothership` | `glitch` | `soft` | `root`
- Celebrations: pack-matched ~60% + shared library ~40%; tint library to active pack
- Display: small → toast ~1.5s; big → overlay ~2–2.5s; respect reduce-motion
- Throttle: max 1 small celebration / 45s; overlays only for big wins (unless intensity `hype` rules below)
- Intensity: `chill` = toast-only; `normal` = hybrid; `hype` = allow overlay for small wins that pass throttle every 3rd celebration
- Sound default: `orbital.sound.enabled` = `false`; never block UI on audio failure
- v1 non-goals: mini-game, 2h jokes, other IDEs, accounts, large GIF libraries
- Prefer silent degrade over false-positive spam for trigger detection
- Test-pass detection (resolved): (1) VS Code Testing API `vscode.tests` results when available; (2) Task end with name matching `/test|jest|vitest|pytest|mocha|phpunit/i` and exit code 0; (3) no noisy terminal regex fishing in v1 beyond task names
- Celebration surface (resolved): single short-lived `WebviewPanel` (`orbital.celebration`) with transparent CSS; `mode: toast | overlay`
- First-run (resolved): on activate, if `globalState.orbital.onboarded !== true`, QuickPick pack → optional sound enable → set onboarded
- Commits after each task; run Vitest before claiming logic done

## File structure (create)

```
package.json
tsconfig.json
vitest.config.ts
.gitignore                    (extend: out/, node_modules/, *.vsix)
README.md
WORK_PROGRESS.md             (update each task)
src/extension.ts
src/packs/types.ts
src/packs/registry.ts
src/config/settings.ts
src/celebrations/types.ts
src/celebrations/throttle.ts
src/celebrations/classifier.ts
src/celebrations/picker.ts
src/celebrations/captions.ts
src/celebrations/loops.ts
src/celebrations/host.ts
src/celebrations/engine.ts
src/audio/sfxPlayer.ts
src/triggers/registerTriggers.ts
src/triggers/testTrigger.ts
src/triggers/buildTrigger.ts
src/triggers/gitTrigger.ts
src/triggers/debugTrigger.ts
src/triggers/saveTrigger.ts
src/commands/registerCommands.ts
src/onboarding/firstRun.ts
src/__tests__/throttle.test.ts
src/__tests__/classifier.test.ts
src/__tests__/picker.test.ts
src/__tests__/settings.test.ts
themes/mothership-color-theme.json
themes/glitch-color-theme.json
themes/soft-abduction-color-theme.json
themes/root-access-color-theme.json
media/webview/celebration.css
media/sfx/mothership.wav
media/sfx/glitch.wav
media/sfx/soft.wav
media/sfx/root.wav
```

---

### Task 1: Scaffold extension + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/extension.ts`, `README.md`
- Modify: `.gitignore`
- Test: smoke via `npm test` (empty suite ok after config)

**Interfaces:**
- Consumes: none
- Produces: activatable extension stub `activate` / `deactivate`; npm scripts `compile`, `watch`, `test`, `package`

- [ ] **Step 1: Init npm and install deps**

```bash
cd "/Users/macbook/Desktop/Aliens theme"
npm init -y
npm install -D typescript @types/vscode @types/node vitest esbuild @vscode/vsce
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "out",
    "rootDir": "src",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vscode"]
  },
  "include": ["src/**/*"],
  "exclude": ["src/__tests__/**"]
}
```

- [ ] **Step 3: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Write minimal `package.json` fields** (merge into existing)

Set `name` to `orbital`, `displayName` to `Orbital`, `publisher` to `orbital` (change later if publishing), `engines.vscode` to `^1.85.0`, `main` to `./out/extension.js`, `activationEvents` to `["onStartupFinished"]`, scripts:

```json
{
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "test": "vitest run",
    "test:watch": "vitest",
    "package": "vsce package",
    "vscode:prepublish": "npm run compile"
  }
}
```

Empty `contributes: { themes: [], commands: [], configuration: {} }` for now.

- [ ] **Step 5: Write `src/extension.ts` stub**

```ts
import * as vscode from 'vscode';

export function activate(_context: vscode.ExtensionContext): void {
  console.log('Orbital activated');
}

export function deactivate(): void {}
```

- [ ] **Step 6: Update `.gitignore`**

Append:

```
out/
node_modules/
*.vsix
.vscode-test/
```

- [ ] **Step 7: Write short `README.md`**

One paragraph: Orbital is an alien/UFO theme + celebration companion for Cursor/VS Code. Link to `docs/superpowers/specs/2026-08-29-orbital-design.md`.

- [ ] **Step 8: Compile**

Run: `npm run compile`  
Expected: `out/extension.js` exists, no errors

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts src/extension.ts README.md .gitignore
git commit -m "chore: scaffold Orbital VS Code extension"
```

---

### Task 2: Pack types + registry

**Files:**
- Create: `src/packs/types.ts`, `src/packs/registry.ts`
- Test: `src/__tests__/settings.test.ts` will cover settings later; for this task add `src/__tests__/registry.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export type PackId = 'mothership' | 'glitch' | 'soft' | 'root'`
  - `export interface PackDefinition { id: PackId; label: string; themePath: string; sfxFile: string; tint: string; }`
  - `export const PACKS: Record<PackId, PackDefinition>`
  - `export function isPackId(value: string): value is PackId`
  - `export function getPack(id: PackId): PackDefinition`

- [ ] **Step 1: Write failing test `src/__tests__/registry.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { isPackId, getPack, PACKS } from '../packs/registry';

describe('pack registry', () => {
  it('accepts only four pack ids', () => {
    expect(isPackId('mothership')).toBe(true);
    expect(isPackId('glitch')).toBe(true);
    expect(isPackId('soft')).toBe(true);
    expect(isPackId('root')).toBe(true);
    expect(isPackId('neon')).toBe(false);
  });

  it('returns tint and label for mothership', () => {
    const pack = getPack('mothership');
    expect(pack.label).toBe('Mothership OS');
    expect(pack.tint).toMatch(/^#/);
    expect(Object.keys(PACKS)).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- src/__tests__/registry.test.ts`  
Expected: FAIL cannot find module

- [ ] **Step 3: Implement `src/packs/types.ts`**

```ts
export type PackId = 'mothership' | 'glitch' | 'soft' | 'root';

export interface PackDefinition {
  id: PackId;
  label: string;
  themePath: string;
  sfxFile: string;
  /** Hex accent used to tint shared library loops */
  tint: string;
}
```

- [ ] **Step 4: Implement `src/packs/registry.ts`**

```ts
import { PackDefinition, PackId } from './types';

export const PACKS: Record<PackId, PackDefinition> = {
  mothership: {
    id: 'mothership',
    label: 'Mothership OS',
    themePath: './themes/mothership-color-theme.json',
    sfxFile: 'mothership.wav',
    tint: '#1cff9a',
  },
  glitch: {
    id: 'glitch',
    label: 'Glitch Transmission',
    themePath: './themes/glitch-color-theme.json',
    sfxFile: 'glitch.wav',
    tint: '#b8ff40',
  },
  soft: {
    id: 'soft',
    label: 'Soft Abduction',
    themePath: './themes/soft-abduction-color-theme.json',
    sfxFile: 'soft.wav',
    tint: '#f4a261',
  },
  root: {
    id: 'root',
    label: 'Root Access',
    themePath: './themes/root-access-color-theme.json',
    sfxFile: 'root.wav',
    tint: '#33ff66',
  },
};

export function isPackId(value: string): value is PackId {
  return value in PACKS;
}

export function getPack(id: PackId): PackDefinition {
  return PACKS[id];
}
```

- [ ] **Step 5: Run test — expect PASS**

Run: `npm test -- src/__tests__/registry.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/packs src/__tests__/registry.test.ts
git commit -m "feat: add Orbital pack registry"
```

---

### Task 3: Four color themes + package contributions

**Files:**
- Create: `themes/mothership-color-theme.json`, `themes/glitch-color-theme.json`, `themes/soft-abduction-color-theme.json`, `themes/root-access-color-theme.json`
- Modify: `package.json` `contributes.themes`

**Interfaces:**
- Consumes: pack labels from registry (manual mirror in package.json)
- Produces: four selectable workbench themes in Cursor/VS Code

- [ ] **Step 1: Create mothership theme JSON** (dark bioluminescent)

`themes/mothership-color-theme.json` — include at minimum:

```json
{
  "name": "Orbital — Mothership OS",
  "type": "dark",
  "colors": {
    "editor.background": "#061018",
    "editor.foreground": "#c8efe0",
    "activityBar.background": "#04121a",
    "sideBar.background": "#04121a",
    "statusBar.background": "#1cff9a",
    "statusBar.foreground": "#061018",
    "titleBar.activeBackground": "#04121a",
    "focusBorder": "#1cff9a",
    "button.background": "#1cff9a",
    "button.foreground": "#061018"
  },
  "tokenColors": [
    { "scope": ["comment"], "settings": { "foreground": "#2f6b58" } },
    { "scope": ["keyword"], "settings": { "foreground": "#1cff9a" } },
    { "scope": ["string"], "settings": { "foreground": "#ffe56b" } },
    { "scope": ["entity.name.function"], "settings": { "foreground": "#7dffd4" } }
  ]
}
```

- [ ] **Step 2: Create glitch theme** — bg `#0c1008`, accents `#b8ff40` / `#ff9f1c` / `#ff4d00`

- [ ] **Step 3: Create soft theme** — bg `#16121c`, accents `#f4a261` / `#a8dadc` / `#e9c46a`

- [ ] **Step 4: Create root theme** — bg `#050805`, accents `#33ff66` / `#9dffb0` / `#ff3344`

(Same structure as Step 1; swap palette values to match pack feel from the design spec.)

- [ ] **Step 5: Wire `package.json` contributes.themes**

```json
"contributes": {
  "themes": [
    {
      "label": "Orbital — Mothership OS",
      "uiTheme": "vs-dark",
      "path": "./themes/mothership-color-theme.json"
    },
    {
      "label": "Orbital — Glitch Transmission",
      "uiTheme": "vs-dark",
      "path": "./themes/glitch-color-theme.json"
    },
    {
      "label": "Orbital — Soft Abduction",
      "uiTheme": "vs-dark",
      "path": "./themes/soft-abduction-color-theme.json"
    },
    {
      "label": "Orbital — Root Access",
      "uiTheme": "vs-dark",
      "path": "./themes/root-access-color-theme.json"
    }
  ]
}
```

- [ ] **Step 6: Manual check**

Run Extension Development Host (`F5` with a `.vscode/launch.json` `extensionHost` config).  
Expected: all four themes appear under Color Theme picker.

Add `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Orbital Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"]
    }
  ]
}
```

- [ ] **Step 7: Commit**

```bash
git add themes package.json .vscode/launch.json
git commit -m "feat: add four Orbital color themes"
```

---

### Task 4: Settings reader

**Files:**
- Create: `src/config/settings.ts`
- Modify: `package.json` `contributes.configuration`
- Test: `src/__tests__/settings.test.ts`

**Interfaces:**
- Consumes: `PackId`, `isPackId`
- Produces:
  - `export type Intensity = 'chill' | 'normal' | 'hype'`
  - `export type ReduceMotion = 'auto' | 'always' | 'never'`
  - `export interface TriggerSettings { tests: boolean; build: boolean; commit: boolean; debug: boolean; save: boolean; }`
  - `export interface OrbitalSettings { pack: PackId; celebrationsEnabled: boolean; intensity: Intensity; triggers: TriggerSettings; soundEnabled: boolean; mutedPacks: PackId[]; reduceMotion: ReduceMotion; }`
  - `export function readSettings(getConfig?: () => vscode.WorkspaceConfiguration): OrbitalSettings` — for tests, inject a fake config object with `.get(key, default)`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { readSettings } from '../config/settings';

function fakeConfig(map: Record<string, unknown>) {
  return {
    get<T>(key: string, defaultValue: T): T {
      return (key in map ? map[key] : defaultValue) as T;
    },
  };
}

describe('readSettings', () => {
  it('applies defaults', () => {
    const s = readSettings(() => fakeConfig({}) as never);
    expect(s.pack).toBe('mothership');
    expect(s.celebrationsEnabled).toBe(true);
    expect(s.intensity).toBe('normal');
    expect(s.soundEnabled).toBe(false);
    expect(s.triggers.tests).toBe(true);
    expect(s.triggers.save).toBe(false);
  });

  it('falls back on invalid pack id', () => {
    const s = readSettings(() => fakeConfig({ pack: 'nope' }) as never);
    expect(s.pack).toBe('mothership');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `src/config/settings.ts`**

```ts
import { isPackId, PackId } from '../packs/registry';

export type Intensity = 'chill' | 'normal' | 'hype';
export type ReduceMotion = 'auto' | 'always' | 'never';

export interface TriggerSettings {
  tests: boolean;
  build: boolean;
  commit: boolean;
  debug: boolean;
  save: boolean;
}

export interface OrbitalSettings {
  pack: PackId;
  celebrationsEnabled: boolean;
  intensity: Intensity;
  triggers: TriggerSettings;
  soundEnabled: boolean;
  mutedPacks: PackId[];
  reduceMotion: ReduceMotion;
}

export interface ConfigLike {
  get<T>(section: string, defaultValue: T): T;
}

const DEFAULTS: OrbitalSettings = {
  pack: 'mothership',
  celebrationsEnabled: true,
  intensity: 'normal',
  triggers: { tests: true, build: true, commit: true, debug: true, save: false },
  soundEnabled: false,
  mutedPacks: [],
  reduceMotion: 'auto',
};

export function readSettings(getConfig: () => ConfigLike): OrbitalSettings {
  const c = getConfig();
  const packRaw = c.get<string>('pack', DEFAULTS.pack);
  const intensityRaw = c.get<string>('celebrations.intensity', DEFAULTS.intensity);
  const reduceRaw = c.get<string>('reduceMotion', DEFAULTS.reduceMotion);
  const muted = c.get<string[]>('sound.mutedPacks', []);

  const intensity: Intensity =
    intensityRaw === 'chill' || intensityRaw === 'normal' || intensityRaw === 'hype'
      ? intensityRaw
      : 'normal';

  const reduceMotion: ReduceMotion =
    reduceRaw === 'auto' || reduceRaw === 'always' || reduceRaw === 'never'
      ? reduceRaw
      : 'auto';

  return {
    pack: isPackId(packRaw) ? packRaw : 'mothership',
    celebrationsEnabled: c.get('celebrations.enabled', true),
    intensity,
    triggers: {
      tests: c.get('celebrations.triggers.tests', true),
      build: c.get('celebrations.triggers.build', true),
      commit: c.get('celebrations.triggers.commit', true),
      debug: c.get('celebrations.triggers.debug', true),
      save: c.get('celebrations.triggers.save', false),
    },
    soundEnabled: c.get('sound.enabled', false),
    mutedPacks: muted.filter(isPackId),
    reduceMotion,
  };
}

/** Production helper — call with vscode.workspace.getConfiguration('orbital') */
export function getOrbitalConfig(): ConfigLike {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vscode = require('vscode') as typeof import('vscode');
  return vscode.workspace.getConfiguration('orbital');
}
```

Note: In `extension.ts`, prefer:

```ts
readSettings(() => vscode.workspace.getConfiguration('orbital'));
```

and keep `getOrbitalConfig` unused or delete it if require is awkward — **use only the injectible `readSettings(() => vscode.workspace.getConfiguration('orbital'))` form in production.** Remove `getOrbitalConfig` if present.

- [ ] **Step 4: Add `contributes.configuration` in package.json**

Properties: `orbital.pack` (enum), `orbital.celebrations.enabled`, `orbital.celebrations.intensity`, `orbital.celebrations.triggers.tests|build|commit|debug|save`, `orbital.sound.enabled`, `orbital.sound.mutedPacks`, `orbital.reduceMotion` — defaults matching `DEFAULTS`.

- [ ] **Step 5: Run tests — PASS**

- [ ] **Step 6: Commit**

```bash
git add src/config/settings.ts src/__tests__/settings.test.ts package.json
git commit -m "feat: add Orbital settings reader and contribution"
```

---

### Task 5: Throttle

**Files:**
- Create: `src/celebrations/throttle.ts`, `src/celebrations/types.ts`
- Test: `src/__tests__/throttle.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export type WinKind = 'tests' | 'build' | 'commit' | 'debug' | 'save' | 'preview'`
  - `export type WinSize = 'small' | 'big'`
  - `export interface WinEvent { kind: WinKind; size: WinSize; at?: number }`
  - `export class CelebrationThrottle { constructor(private windowMs = 45_000); allow(event: WinEvent, now?: number): boolean; }`
  - Rule: big wins always allowed (still update last-small timestamp only for small); small wins allowed if `now - lastSmall >= windowMs`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { CelebrationThrottle } from '../celebrations/throttle';

describe('CelebrationThrottle', () => {
  it('blocks small wins inside 45s window', () => {
    const t = new CelebrationThrottle(45_000);
    expect(t.allow({ kind: 'commit', size: 'small' }, 1000)).toBe(true);
    expect(t.allow({ kind: 'commit', size: 'small' }, 20_000)).toBe(false);
    expect(t.allow({ kind: 'commit', size: 'small' }, 46_000)).toBe(true);
  });

  it('always allows big wins', () => {
    const t = new CelebrationThrottle(45_000);
    t.allow({ kind: 'commit', size: 'small' }, 1000);
    expect(t.allow({ kind: 'build', size: 'big' }, 2000)).toBe(true);
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement types + throttle**

`src/celebrations/types.ts`:

```ts
export type WinKind = 'tests' | 'build' | 'commit' | 'debug' | 'save' | 'preview';
export type WinSize = 'small' | 'big';

export interface WinEvent {
  kind: WinKind;
  size: WinSize;
  at?: number;
}
```

`src/celebrations/throttle.ts`:

```ts
import { WinEvent } from './types';

export class CelebrationThrottle {
  private lastSmallAt = -Infinity;

  constructor(private readonly windowMs = 45_000) {}

  allow(event: WinEvent, now = Date.now()): boolean {
    if (event.size === 'big') {
      return true;
    }
    if (now - this.lastSmallAt < this.windowMs) {
      return false;
    }
    this.lastSmallAt = now;
    return true;
  }
}
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/celebrations/types.ts src/celebrations/throttle.ts src/__tests__/throttle.test.ts
git commit -m "feat: add celebration throttle"
```

---

### Task 6: Win classifier + intensity

**Files:**
- Create: `src/celebrations/classifier.ts`
- Test: `src/__tests__/classifier.test.ts`

**Interfaces:**
- Consumes: `WinKind`, `WinSize`, `Intensity`
- Produces:
  - `export function classifyKind(kind: WinKind): WinSize` — build + full-suite tests → big; commit/debug/save/preview → small; `tests` defaults small unless `meta.fullSuite === true`
  - `export function resolveDisplay(size: WinSize, intensity: Intensity, celebrationIndex: number): 'toast' | 'overlay' | 'none'`
    - chill → always toast
    - normal → big overlay / small toast
    - hype → big overlay; small toast normally; every 3rd small (`celebrationIndex % 3 === 0`) → overlay

- [ ] **Step 1: Failing tests for classify + resolveDisplay**

```ts
import { describe, it, expect } from 'vitest';
import { classifyKind, resolveDisplay } from '../celebrations/classifier';

describe('classifyKind', () => {
  it('marks build as big and commit as small', () => {
    expect(classifyKind('build')).toBe('big');
    expect(classifyKind('commit')).toBe('small');
    expect(classifyKind('tests', { fullSuite: true })).toBe('big');
    expect(classifyKind('tests', { fullSuite: false })).toBe('small');
  });
});

describe('resolveDisplay', () => {
  it('chill forces toast', () => {
    expect(resolveDisplay('big', 'chill', 0)).toBe('toast');
  });
  it('normal maps size to mode', () => {
    expect(resolveDisplay('big', 'normal', 0)).toBe('overlay');
    expect(resolveDisplay('small', 'normal', 0)).toBe('toast');
  });
  it('hype upgrades every 3rd small', () => {
    expect(resolveDisplay('small', 'hype', 0)).toBe('overlay');
    expect(resolveDisplay('small', 'hype', 1)).toBe('toast');
    expect(resolveDisplay('small', 'hype', 3)).toBe('overlay');
  });
});
```

- [ ] **Step 2: Implement**

```ts
import { Intensity } from '../config/settings';
import { WinKind, WinSize } from './types';

export function classifyKind(
  kind: WinKind,
  meta: { fullSuite?: boolean } = {},
): WinSize {
  if (kind === 'build') return 'big';
  if (kind === 'tests' && meta.fullSuite) return 'big';
  return 'small';
}

export function resolveDisplay(
  size: WinSize,
  intensity: Intensity,
  celebrationIndex: number,
): 'toast' | 'overlay' {
  if (intensity === 'chill') return 'toast';
  if (size === 'big') return 'overlay';
  if (intensity === 'hype' && celebrationIndex % 3 === 0) return 'overlay';
  return 'toast';
}
```

- [ ] **Step 3: Tests PASS · Commit**

```bash
git add src/celebrations/classifier.ts src/__tests__/classifier.test.ts
git commit -m "feat: classify wins and resolve display mode"
```

---

### Task 7: Loop inventory, captions, picker (C+D)

**Files:**
- Create: `src/celebrations/loops.ts`, `src/celebrations/captions.ts`, `src/celebrations/picker.ts`
- Test: `src/__tests__/picker.test.ts`

**Interfaces:**
- Consumes: `PackId`
- Produces:
  - `export type LoopId = string`
  - `export interface LoopDef { id: LoopId; kind: 'pack' | 'library'; pack?: PackId; cssClass: string; }`
  - `export const LOOPS: LoopDef[]` — ≥3 pack loops per pack + ≥12 library loops
  - `export function captionFor(kind: WinKind, pack: PackId): string`
  - `export function pickLoop(pack: PackId, random?: () => number): LoopDef` — if `random() < 0.6` pick from pack loops else library; use `random()` in `[0,1)`

- [ ] **Step 1: Failing picker test**

```ts
import { describe, it, expect } from 'vitest';
import { pickLoop } from '../celebrations/picker';

describe('pickLoop', () => {
  it('biases to pack loop when random < 0.6', () => {
    const loop = pickLoop('root', () => 0.1);
    expect(loop.kind).toBe('pack');
    expect(loop.pack).toBe('root');
  });

  it('picks library when random >= 0.6', () => {
    const loop = pickLoop('root', () => 0.9);
    expect(loop.kind).toBe('library');
  });
});
```

- [ ] **Step 2: Implement `loops.ts`** with concrete ids:

Pack examples: `mothership-beam`, `glitch-stamp`, `soft-cow`, `root-sudo` (+ 2 variants each).  
Library examples: `lib-wink`, `lib-liftoff`, `lib-signal`, `lib-shipped`, `lib-pwned`, `lib-radar`, `lib-orbit`, `lib-zap`, `lib-wave`, `lib-spark`, `lib-dock`, `lib-ping`.

- [ ] **Step 3: Implement `captions.ts`**

Map pack+kind to short strings, e.g. root+build → `exploit deployed · build pwned`; soft+commit → `beamed up ✓`; mothership+tests → `TASK ✓ BEAMED`; glitch+build → `CLEAR · 200 OK`.

- [ ] **Step 4: Implement `picker.ts`**

```ts
import { PackId } from '../packs/types';
import { LOOPS, LoopDef } from './loops';

export function pickLoop(pack: PackId, random: () => number = Math.random): LoopDef {
  const usePack = random() < 0.6;
  const pool = usePack
    ? LOOPS.filter((l) => l.kind === 'pack' && l.pack === pack)
    : LOOPS.filter((l) => l.kind === 'library');
  const idx = Math.floor(random() * pool.length) % pool.length;
  return pool[idx]!;
}
```

- [ ] **Step 5: Tests PASS · Commit**

```bash
git add src/celebrations/loops.ts src/celebrations/captions.ts src/celebrations/picker.ts src/__tests__/picker.test.ts
git commit -m "feat: add celebration loop picker and captions"
```

---

### Task 8: Celebration webview host + CSS loops

**Files:**
- Create: `src/celebrations/host.ts`, `media/webview/celebration.css`
- Modify: none of engine yet

**Interfaces:**
- Consumes: `PackDefinition.tint`, `LoopDef`, display mode
- Produces:
  - `export interface CelebrationShowArgs { mode: 'toast' | 'overlay'; loop: LoopDef; caption: string; tint: string; reduceMotion: boolean; durationMs: number; extensionUri: vscode.Uri; }`
  - `export class CelebrationHost { constructor(private vscodeApi: typeof vscode); show(args: CelebrationShowArgs): void; dispose(): void; }`
  - Webview HTML inlines CSS from `media/webview/celebration.css` via `webview.asWebviewUri`
  - Auto-dispose panel after `durationMs` (toast 1500, overlay 2500)
  - If `reduceMotion`, add body class `reduce-motion` (static frame, no CSS animation)

- [ ] **Step 1: Write `celebration.css`** with classes matching every `LoopDef.cssClass` — keyframes for beam, stamp, cow float, sudo term, wink, etc. Toast positions bottom-right; overlay centers full panel. Pack tint applied via `body { --tint: ... }`.

- [ ] **Step 2: Implement `CelebrationHost.show`**

Create panel:

```ts
const panel = vscode.window.createWebviewPanel(
  'orbital.celebration',
  'Orbital',
  { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
  { enableScripts: false, localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')] },
);
```

Set `panel.webview.html` to HTML string with caption + `<div class="loop ${loop.cssClass}">`.  
`setTimeout(() => panel.dispose(), durationMs)`.

Keep only one panel: dispose previous before show.

- [ ] **Step 3: Manual verify with a temporary command** (wired fully in Task 11) — or unit-skip; document manual: Preview command later.

- [ ] **Step 4: Commit**

```bash
git add src/celebrations/host.ts media/webview/celebration.css
git commit -m "feat: add celebration webview host and CSS loops"
```

---

### Task 9: SFX player

**Files:**
- Create: `src/audio/sfxPlayer.ts`, placeholder WAVs under `media/sfx/`
- Test: none (vscode audio); manual

**Interfaces:**
- Consumes: `PackId`, settings sound flags, `extensionUri`
- Produces: `export class SfxPlayer { play(pack: PackId, opts: { enabled: boolean; mutedPacks: PackId[]; extensionUri: vscode.Uri }): void }`
- Implementation: spawn a tiny webview-less approach — use `vscode.Audio` is unavailable; play via celebration webview `<audio autoplay src="...">` injected when sound enabled **or** separate 50ms audio-only webview. Prefer injecting `<audio>` into the celebration HTML when `soundEnabled && !mutedPacks.includes(pack)`.

**Revised:** fold audio tag into `CelebrationHost` HTML when engine passes `sfxUri?: vscode.Uri`. `SfxPlayer.resolveUri(pack, extensionUri): vscode.Uri | undefined` only.

- [ ] **Step 1: Generate four short silent/placeholder wavs** (or commit tiny valid wav bytes). Files: `media/sfx/mothership.wav`, `glitch.wav`, `soft.wav`, `root.wav`.

- [ ] **Step 2: Implement `src/audio/sfxPlayer.ts`**

```ts
import * as vscode from 'vscode';
import { PackId, getPack } from '../packs/registry';

export function resolveSfxUri(
  pack: PackId,
  extensionUri: vscode.Uri,
  enabled: boolean,
  mutedPacks: PackId[],
): vscode.Uri | undefined {
  if (!enabled || mutedPacks.includes(pack)) return undefined;
  const file = getPack(pack).sfxFile;
  return vscode.Uri.joinPath(extensionUri, 'media', 'sfx', file);
}
```

- [ ] **Step 3: Update `CelebrationHost` HTML builder** to include `<audio autoplay src="${uri}">` when uri provided (webview must `enableScripts: false` still ok for autoplay in some hosts — if blocked, set `enableScripts: true` minimal). Prefer `enableScripts: true` with no external script if autoplay requires it.

- [ ] **Step 4: Commit**

```bash
git add src/audio/sfxPlayer.ts media/sfx src/celebrations/host.ts
git commit -m "feat: resolve optional pack SFX for celebrations"
```

---

### Task 10: Celebration engine

**Files:**
- Create: `src/celebrations/engine.ts`

**Interfaces:**
- Consumes: throttle, classifier, picker, captions, host, resolveSfxUri, readSettings, getPack
- Produces:
  - `export class CelebrationEngine { constructor(private ctx: vscode.ExtensionContext, private host: CelebrationHost); handle(kind: WinKind, meta?: { fullSuite?: boolean }): void; preview(): void; dispose(): void; }`
  - Flow: read settings → if !celebrationsEnabled return → classify size → throttle.allow → resolveDisplay → pickLoop → captionFor → resolve reduceMotion (`always` true; `never` false; `auto` use `vscode.env.remoteName` irrelevant — use `workspace.getConfiguration('editor').get('accessibilitySupport')` OR check `host` prefers: pass `reduceMotion === 'always' || (reduceMotion === 'auto' && process.env.ORB_TEST_REDUCE === '1')`; in production `auto` → `false` unless `vscode.window.activeColorTheme` N/A — **use:** `auto` maps to CSS `@media (prefers-reduced-motion)` inside webview (pass `reduceMotion: reduceMotion === 'always'`, and if `auto` set attribute `data-reduce="auto"` so CSS media query applies)
  - Increment internal `celebrationIndex` on each shown celebration
  - `preview()` calls `handle('preview')` bypassing trigger toggles but respecting throttle? **Preview bypasses throttle.**

- [ ] **Step 1: Implement engine** with explicit methods as above

- [ ] **Step 2: Wire activate stub to construct engine** (triggers still empty)

- [ ] **Step 3: Commit**

```bash
git add src/celebrations/engine.ts src/extension.ts
git commit -m "feat: wire celebration engine"
```

---

### Task 11: Commands + first-run onboarding

**Files:**
- Create: `src/commands/registerCommands.ts`, `src/onboarding/firstRun.ts`
- Modify: `package.json` commands contribution, `src/extension.ts`

**Interfaces:**
- Commands: `orbital.switchPack`, `orbital.previewCelebration`, `orbital.toggleSound`
- `runFirstRunIfNeeded(context, engine): Promise<void>`

- [ ] **Step 1: Implement switch pack QuickPick** writing `orbital.pack` and optionally `workbench.colorTheme` to matching theme label

- [ ] **Step 2: Preview → `engine.preview()`**

- [ ] **Step 3: Toggle sound → flip `orbital.sound.enabled`**

- [ ] **Step 4: First-run** if `!context.globalState.get('orbital.onboarded')`: QuickPick packs → ask sound Yes/No → update settings → `globalState.update('orbital.onboarded', true)`

- [ ] **Step 5: Register in `activate` · contribute commands in package.json**

- [ ] **Step 6: Manual: F5 → onboarding appears once · commands work**

- [ ] **Step 7: Commit**

```bash
git add src/commands src/onboarding src/extension.ts package.json
git commit -m "feat: add Orbital commands and first-run onboarding"
```

---

### Task 12: Triggers (tests, build, git, debug, save)

**Files:**
- Create: all under `src/triggers/*`
- Modify: `src/extension.ts`

**Interfaces:**
- `registerTriggers(context, engine, getSettings): vscode.Disposable[]`
- Each trigger checks corresponding `settings.triggers.*` before `engine.handle`

**Detection rules (v1):**

| Trigger | Mechanism |
|---|---|
| tests | `vscode.tests` onResultsChanged / run finished all passed → `fullSuite: true` if request includes whole workspace profile; else small. Also `vscode.tasks.onDidEndTaskProcess` when task name matches `/test\|jest\|vitest\|pytest\|mocha/i` and `exitCode === 0` → small (fullSuite if name matches `/suite\|all\|ci/i`) |
| build | Task end name matches `/build\|compile\|webpack\|vite build\|tsc/i` and exit 0 → big |
| commit | `vscode.workspace.onDidChangeConfiguration` insufficient — use `vscode.commands.registerCommand` wrapper unavailable. Listen via FileSystemWatcher on `.git/COMMIT_EDITMSG` or `onDidExecuteCommand` — **use:** poll-free approach `extensions` git API: `const git = vscode.extensions.getExtension('vscode.git')?.exports.getAPI(1)`; `repo.onDidCommit(() => ...)` when available; else skip silently |
| debug | `vscode.debug.onDidTerminateDebugSession` — treat as success small win (v1 cannot reliably know failure vs success; only fire when session had no error message — fire always on terminate is too noisy). **v1 rule:** fire small win only when `session.configuration.noDebug !== true` and register `onDidReceiveDebugSessionCustomEvent` skip — simpler: fire on terminate only if a `DebugAdapterTracker` saw no failed stopped events. **Simplest reliable v1:** expose command `Orbital: Celebrate Debug Win` deferred — Spec says debug end success ON by default. Use tracker: |

```ts
vscode.debug.registerDebugAdapterTrackerFactory('*', {
  createDebugAdapterTracker() {
    let failed = false;
    return {
      onDidSendMessage(msg) {
        if (msg.type === 'event' && msg.event === 'output' && /error/i.test(msg.body?.output ?? '')) {
          /* ignore */
        }
        if (msg.type === 'response' && msg.command === 'configurationDone' && msg.success === false) failed = true;
      },
      onExit() { /* handled below */ },
    };
  },
});
```

**Pragmatic v1:** `onDidTerminateDebugSession` → small win always, gated by throttle — document as best-effort. User can disable trigger.

| save | `vscode.workspace.onDidSaveTextDocument` → small, default off |

- [ ] **Step 1: Implement each trigger file calling `engine.handle`**

- [ ] **Step 2: `registerTriggers` composes disposables**

- [ ] **Step 3: Manual test matrix** — run tests task, build task, commit, save with trigger on

- [ ] **Step 4: Commit**

```bash
git add src/triggers src/extension.ts
git commit -m "feat: register Orbital celebration triggers"
```

---

### Task 13: Polish, README, package vsix, progress docs

**Files:**
- Modify: `README.md`, `WORK_PROGRESS.md`, `package.json` (icon optional skip)
- Create: `docs/superpowers/plans` already exists this file

- [ ] **Step 1: README** — install, pick theme, settings table, commands, link to design spec

- [ ] **Step 2: Run full `npm test` + `npm run compile`**

Expected: all tests PASS; compile clean

- [ ] **Step 3: `npx vsce package`** (allow missing repository warning)

Expected: `orbital-0.0.1.vsix` created

- [ ] **Step 4: Update `WORK_PROGRESS.md`** — status v1 implemented / packaging done

- [ ] **Step 5: Commit**

```bash
git add README.md WORK_PROGRESS.md package.json
git commit -m "docs: finalize Orbital v1 README and package metadata"
```

---

## Spec coverage checklist

| Spec item | Task |
|---|---|
| 4 theme packs | 2, 3 |
| C+D celebrations | 7, 8, 10 |
| Hybrid toast/overlay | 6, 8, 10 |
| Throttle 45s | 5 |
| Intensity chill/normal/hype | 4, 6 |
| Triggers defaults | 4, 12 |
| Pack SFX optional | 9, 10 |
| Settings + commands | 4, 11 |
| Reduce motion | 8, 10 |
| First-run | 11 |
| Single vsix | 1, 13 |
| Non-goals excluded | — (no tasks) |

## Placeholder / consistency self-review

- Pack IDs consistent: `mothership|glitch|soft|root`
- `WinKind` / `WinSize` shared via `celebrations/types.ts`
- `readSettings` injectable for tests
- Open spec items resolved in Global Constraints
- No TBD steps remaining
