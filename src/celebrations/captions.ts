import { PackId } from '../packs/types';
import { WinKind } from './types';

export interface PickedCaption {
  line: string;
  subline?: string;
}

const LINES: Record<PackId, Record<WinKind, readonly string[]>> = {
  mothership: {
    tests: [
      'TASK ✓ BEAMED UP',
      'ALL SYSTEMS GREEN · SHIP IT',
      'TESTS PASSED · ORBIT LOCKED',
      'BEAM RECEIVED · NICE WORK',
      'GREEN LIGHT · YOU DID THAT',
      'DOCKING COMPLETE ✓',
    ],
    build: ['BUILD LIFTED · DOCKED', 'COMPILE CLEAR · THRUSTERS ON', 'BUILD GREEN · LAUNCH READY'],
    commit: ['COMMIT ABOARD ✓', 'PAYLOAD SECURED · PUSHED', 'COMMIT DOCKED · CLEAN'],
    debug: ['PROBE ACTIVE · SCANNING', 'DEBUG BEAM · ONLINE', 'SENSORS LOCKED · HUNTING BUGS'],
    save: ['FILE STOWED ✓', 'CARGO SAVED · SECURE', 'DATA PACKED · ALL GOOD'],
    preview: ['PREVIEW ORBIT · LIVE', 'TEST FLIGHT · GO', 'DEMO BEAM · ACTIVE'],
  },
  glitch: {
    tests: [
      'TESTS ✓ YEETED',
      'SIGNAL CLEAR · NO STATIC',
      'ALL GREEN · TRANSMISSION OK',
      'SUITE STAMPED · PASSED',
      'VHS GREEN · SHIP IT',
      'NOISE FLOOR · ZERO FAILS',
    ],
    build: ['CLEAR · 200 OK', 'BUILD STAMPED · SHIPPED', 'COMPILE LOCK · GOOD'],
    commit: ['COMMIT STAMPED · SHIPPED', 'PATCH DROPPED · LIVE', 'COMMIT CLEAR · SENT'],
    debug: ['SIGNAL LOCK · DEBUG ON', 'FREQ LOCKED · TRACING', 'STATIC LOW · PROBING'],
    save: ['SAVED · NO STATIC', 'FILE TAPED · OK', 'WRITE CLEAR · STORED'],
    preview: ['PREVIEW · TRANSMISSION LIVE', 'TEST PATTERN · ON AIR', 'GLITCH CHECK · LIVE'],
  },
  soft: {
    tests: [
      'tests passed · cozy ✓',
      'all green · soft landing',
      'suite floated through ✓',
      'nice work · orbit calm',
      'green vibes · ship it',
      'passed · gentle win',
    ],
    build: ['build landed softly ✓', 'compile drifted in · ok', 'build cozy · done'],
    commit: ['beamed up ✓', 'commit floating away', 'saved to the cloud fr'],
    debug: ['gentle probe · debugging', 'soft scan · on it', 'cozy debug mode'],
    save: ['saved · floating calm', 'file tucked in ✓', 'soft save · all good'],
    preview: ['preview drifting ✓', 'demo orbit · chill', 'test float · live'],
  },
  root: {
    tests: [
      'exploit deployed · tests pwned',
      'all tests · root access granted',
      'suite owned · 0xOK',
      'green shell · tests pass',
      'payload delivered · gg',
      'tests pwned · exit 0',
    ],
    build: ['exploit deployed · build pwned', 'compile owned · ok', 'build shell · success'],
    commit: ['sudo commit · pushed', 'git push · owned', 'commit injected · live'],
    debug: ['root shell · debugging', 'gdb vibes · tracing', 'breakpoint · engaged'],
    save: ['chmod 644 · saved', 'file written · root ok', 'saved to disk · gg'],
    preview: ['preview exec · live', 'dry run · pwned', 'demo shell · active'],
  },
};

const SUBLINES: Record<PackId, Record<WinKind, readonly string[]>> = {
  mothership: {
    tests: ['earthling status: cracked', 'mothership approves', 'beam intensity: max', 'orbit vibes immaculate'],
    build: ['thrusters nominal', 'hull integrity: 100%'],
    commit: ['transmission logged', 'crew notified'],
    debug: ['scanning your code', 'no aliens harmed'],
    save: ['bay doors closed', 'manifest updated'],
    preview: ['demo mode engaged', 'ufo watching proudly'],
  },
  glitch: {
    tests: ['tape quality: pristine', 'static levels: minimal', 'certified unhinged'],
    build: ['stamp applied', 'fax machine happy'],
    commit: ['transmission sent', 'no corruption detected'],
    debug: ['tracking the glitch', 'VHS rewinding'],
    save: ['bits preserved', 'noise filtered'],
    preview: ['test pattern running', 'signal strong'],
  },
  soft: {
    tests: ['you earned a soft win', 'the cow is proud', 'floating through life'],
    build: ['landed like a cloud', 'no turbulence detected'],
    commit: ['gentle push complete', 'stars aligned'],
    debug: ['softly hunting bugs', 'peach beam active'],
    save: ['dream save complete', 'cozy bytes stored'],
    preview: ['drift mode on', 'warm pixels ahead'],
  },
  root: {
    tests: ['shell access: granted', 'kernel says gg', 'zero day avoided (today)'],
    build: ['build owned', 'compiler pwned politely'],
    commit: ['push force avoided · nice', 'git history: immaculate'],
    debug: ['strace your problems away', 'sudo vibes only'],
    save: ['permissions set · vibe ok', 'inode secured'],
    preview: ['simulation running', 'no rm -rf detected'],
  },
};

export function pickCaption(
  kind: WinKind,
  pack: PackId,
  random: () => number = Math.random,
): PickedCaption {
  const lines = LINES[pack][kind];
  const line = lines[Math.floor(random() * lines.length)] ?? lines[0]!;

  const subs = SUBLINES[pack][kind];
  const subline =
    subs && subs.length > 0 ? subs[Math.floor(random() * subs.length)] : undefined;

  return { line, subline };
}

/** @deprecated use pickCaption for rotating lines */
export function captionFor(kind: WinKind, pack: PackId): string {
  return pickCaption(kind, pack).line;
}
