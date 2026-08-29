import { PackId } from '../packs/types';
import { WinKind } from './types';

const CAPTIONS: Record<PackId, Record<WinKind, string>> = {
  mothership: {
    tests: '👽 TASK ✓ BEAMED UP',
    build: '🛸 BUILD LIFTED · DOCKED',
    commit: '👽 COMMIT ABOARD ✓',
    debug: '📡 PROBE ACTIVE · SCANNING',
    save: '📦 FILE STOWED ✓',
    preview: '✨ PREVIEW ORBIT · LIVE',
  },
  glitch: {
    tests: '👾 TESTS ✓ YEETED',
    build: '📡 CLEAR · 200 OK',
    commit: '👾 COMMIT STAMPED · SHIPPED',
    debug: '📻 SIGNAL LOCK · DEBUG ON',
    save: '💾 SAVED · NO STATIC',
    preview: '👾 PREVIEW · TRANSMISSION LIVE',
  },
  soft: {
    tests: '🛸 tests passed · cozy ✓',
    build: '☁️ build landed softly ✓',
    commit: '🐄 beamed up ✓',
    debug: '💫 gentle probe · debugging',
    save: '🌙 saved · floating calm',
    preview: '✨ preview drifting ✓',
  },
  root: {
    tests: '💻 exploit deployed · tests pwned',
    build: '💻 exploit deployed · build pwned',
    commit: '💻 sudo commit · pushed',
    debug: '🖥️ root shell · debugging',
    save: '💾 chmod 644 · saved',
    preview: '⚡ preview exec · live',
  },
};

export function captionFor(kind: WinKind, pack: PackId): string {
  return CAPTIONS[pack][kind];
}
