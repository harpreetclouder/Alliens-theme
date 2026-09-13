import { PackId } from '../packs/types';
import { AnimFlavor, ContentBite, ContentLibrary } from './contentLibrary';
import { WinKind } from './types';

export interface PickedCaption {
  line: string;
  subline?: string;
  tone?: string;
  anim: AnimFlavor;
  source: 'pack' | 'library';
  biteId?: string;
}

/** Classic pack lines — always available as fallback / mix-in. */
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
    checkin: ['MISSION BRIEFING · DAY START', 'ORBIT CHECK-IN ✓', 'CREW ONLINE · NEW DAY'],
    pack: ['PACK SWITCH · BEAMED', 'NEW SKIN · DOCKED', 'ORBIT THEME · LOCKED'],
    levelup: ['LEVEL UP · THRUSTERS'],
    achievement: ['ACHIEVEMENT · LOGGED'],
    mission: ['MISSION CLEAR · ORBIT'],
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
    checkin: ['DAY START · SIGNAL UP', 'CHECK-IN · NO STATIC', 'MISSION BRIEF · LIVE'],
    pack: ['PACK SWAP · STAMPED', 'THEME PATCH · LIVE', 'SKIN CLEAR · 200'],
    levelup: ['LEVEL UP · STAMPED'],
    achievement: ['ACHIEVEMENT · TAPED'],
    mission: ['MISSION CLEAR · SENT'],
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
    checkin: ['soft check-in · new day', 'mission briefing · cozy', 'orbit wake · gentle'],
    pack: ['pack floated in ✓', 'new skin · soft land', 'theme tucked · cute'],
    levelup: ['level up · soft glow'],
    achievement: ['achievement · floated'],
    mission: ['mission clear · cozy'],
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
    checkin: ['day start · shell online', 'check-in · root ready', 'mission brief · sudo'],
    pack: ['pack inject · live', 'theme owned · swap', 'skin chmod · ok'],
    levelup: ['level up · root'],
    achievement: ['achievement · owned'],
    mission: ['mission clear · gg'],
  },
  acid: {
    tests: [
      'TESTS ✓ STICKERED',
      'ALL GREEN · COLLAGE COMPLETE',
      'SUITE PINNED · SHIP IT',
      'PASS · MOOD BOARD APPROVED',
      'GREEN LIGHT · CHAOS CURATED',
      'TESTS PASSED · PEEL & SHIP',
    ],
    build: ['BUILD ✓ STICKERED', 'COMPILE · COLLAGE LOCK', 'BUILD PINNED · LIVE'],
    commit: ['COMMIT · PEEL & SHIP', 'PUSH PINNED · ICONIC', 'COMMIT STICKERED ✓'],
    debug: ['DEBUG · PIN THE BUG', 'PROBE · SCRAPBOOK MODE', 'TRACE · STICKER TRAIL'],
    save: ['SAVED · PINNED', 'FILE STICKERED ✓', 'WRITE · COLLAGE SAFE'],
    preview: ['PREVIEW · MOOD BOARD LIVE', 'DEMO · ACID ARC', 'TEST STICKER · ON'],
    checkin: ['DAY START · PINNED', 'CHECK-IN · COLLAGE OPEN', 'MISSION BRIEF · STICKERED'],
    pack: ['PACK SWAP · PEEL', 'NEW SKIN · PINNED', 'THEME · MOOD LOCK'],
    levelup: ['LEVEL UP · STICKERED'],
    achievement: ['ACHIEVEMENT · PINNED'],
    mission: ['MISSION CLEAR · ICONIC'],
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
    checkin: ['daily mission rolled', 'crew brief complete'],
    pack: ['wardrobe updated', 'hull repainted'],
    levelup: ['rank climbing'],
    achievement: ['badge secured'],
    mission: ['objective complete'],
  },
  glitch: {
    tests: ['tape quality: pristine', 'static levels: minimal', 'certified unhinged'],
    build: ['stamp applied', 'fax machine happy'],
    commit: ['transmission sent', 'no corruption detected'],
    debug: ['tracking the glitch', 'VHS rewinding'],
    save: ['bits preserved', 'noise filtered'],
    preview: ['test pattern running', 'signal strong'],
    checkin: ['briefing transmitted', 'tape rolling'],
    pack: ['channel flipped', 'skin patched'],
    levelup: ['gain stamped'],
    achievement: ['trophy faxed'],
    mission: ['objective clear'],
  },
  soft: {
    tests: ['you earned a soft win', 'the cow is proud', 'floating through life'],
    build: ['landed like a cloud', 'no turbulence detected'],
    commit: ['gentle push complete', 'stars aligned'],
    debug: ['softly hunting bugs', 'peach beam active'],
    save: ['dream save complete', 'cozy bytes stored'],
    preview: ['drift mode on', 'warm pixels ahead'],
    checkin: ['soft briefing ready', 'gentle day open'],
    pack: ['outfit floated on', 'mood swapped'],
    levelup: ['soft climb'],
    achievement: ['cozy badge'],
    mission: ['daily done'],
  },
  root: {
    tests: ['shell access: granted', 'kernel says gg', 'zero day avoided (today)'],
    build: ['build owned', 'compiler pwned politely'],
    commit: ['push force avoided · nice', 'git history: immaculate'],
    debug: ['strace your problems away', 'sudo vibes only'],
    save: ['permissions set · vibe ok', 'inode secured'],
    preview: ['simulation running', 'no rm -rf detected'],
    checkin: ['cron wake · ok', 'briefing sourced'],
    pack: ['theme chowned', 'skin linked'],
    levelup: ['xp owned'],
    achievement: ['badge chmod'],
    mission: ['objective pwned'],
  },
  acid: {
    tests: ['scrapbook says: iconic', 'pinned to the mood board', 'chaos: curated', 'lime check ✓'],
    build: ['collage locked', 'sticker seal applied'],
    commit: ['peel complete', 'board updated'],
    debug: ['following the pin trail', 'magenta pulse active'],
    save: ['clipped to the page', 'paper safe'],
    preview: ['continuous arc running', 'acid vibes online'],
    checkin: ['page opened', 'briefing pinned'],
    pack: ['cover swapped', 'palette peeled'],
    levelup: ['scrapbook leveled'],
    achievement: ['sticker earned'],
    mission: ['board cleared'],
  },
};

const LIBRARY_WEIGHT = 0.94;

function pickPackCaption(
  kind: WinKind,
  pack: PackId,
  random: () => number,
  library: ContentLibrary,
): PickedCaption {
  const lines = LINES[pack][kind];
  const line = lines[Math.floor(random() * lines.length)] ?? lines[0]!;
  const subs = SUBLINES[pack][kind];
  const subline =
    subs && subs.length > 0 ? subs[Math.floor(random() * subs.length)] : undefined;
  return {
    line,
    subline,
    anim: library.pickAnim(undefined, random),
    source: 'pack',
  };
}

function fromBite(bite: ContentBite, library: ContentLibrary, random: () => number): PickedCaption {
  return {
    line: bite.line,
    subline: bite.subline,
    tone: bite.tone,
    anim: library.pickAnim(bite.anim, random),
    source: 'library',
    biteId: bite.id,
  };
}

/**
 * Mixes pack captions with the agent-extensible joke/satire library.
 * Prefers library bites; pass excludeIds to avoid recent repeats.
 */
export function pickCaption(
  kind: WinKind,
  pack: PackId,
  random: () => number = Math.random,
  library: ContentLibrary = ContentLibrary.empty(),
  excludeIds: ReadonlySet<string> = new Set(),
): PickedCaption {
  const bite = library.pickBite(kind, pack, random, excludeIds);
  if (bite && random() < LIBRARY_WEIGHT) {
    return fromBite(bite, library, random);
  }
  return pickPackCaption(kind, pack, random, library);
}

/** @deprecated use pickCaption for rotating lines */
export function captionFor(kind: WinKind, pack: PackId): string {
  return pickCaption(kind, pack).line;
}
