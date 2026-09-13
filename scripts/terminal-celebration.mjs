#!/usr/bin/env node
/**
 * Fullscreen in-terminal celebration (same terminal as npm test).
 * Continuous ease-in-out arc (~20–25fps); alternate screen preserves test output.
 */
import fs from 'node:fs';
import path from 'node:path';

const DURATION_MS = 5000;
const FRAME_MS = 40; // ~25fps

const PACKS = {
  mothership: {
    label: 'MOTHERSHIP OS',
    tint: [28, 255, 154],
    accent2: [125, 255, 212],
    lines: [
      'TASK ✓ BEAMED UP',
      'ALL SYSTEMS GREEN · SHIP IT',
      'TESTS PASSED · ORBIT LOCKED',
      'BEAM RECEIVED · NICE WORK',
    ],
    subs: ['earthling status: cracked', 'mothership approves', 'orbit vibes immaculate'],
    emojis: ['👽', '🛸', '⭐', '🌌'],
  },
  glitch: {
    label: 'GLITCH TRANSMISSION',
    tint: [184, 255, 64],
    accent2: [255, 159, 28],
    lines: ['TESTS ✓ YEETED', 'SIGNAL CLEAR · NO STATIC', 'ALL GREEN · SHIP IT'],
    subs: ['tape quality: pristine', 'certified unhinged'],
    emojis: ['👾', '📺', '⚡', '💾'],
  },
  soft: {
    label: 'SOFT ABDUCTION',
    tint: [244, 162, 97],
    accent2: [255, 214, 170],
    lines: ['tests passed · cozy ✓', 'all green · soft landing', 'nice work · orbit calm'],
    subs: ['you earned a soft win', 'the cow is proud'],
    emojis: ['🛸', '🐄', '☁️', '✨'],
  },
  root: {
    label: 'ROOT ACCESS',
    tint: [51, 255, 102],
    accent2: [180, 255, 200],
    lines: ['tests pwned · exit 0', 'all tests · root access granted', 'suite owned · 0xOK'],
    subs: ['shell access: granted', 'kernel says gg'],
    emojis: ['💻', '🖥️', '🔓', '⚙️'],
  },
  acid: {
    label: 'ACID SCRAPBOOK',
    tint: [214, 255, 60],
    accent2: [255, 45, 149],
    lines: [
      'TESTS ✓ STICKERED',
      'ALL GREEN · COLLAGE COMPLETE',
      'SUITE PINNED · SHIP IT',
      'PASS · MOOD BOARD APPROVED',
    ],
    subs: ['scrapbook says: iconic', 'pinned to the mood board', 'chaos: curated'],
    emojis: ['📒', '✂️', '📌', '✨'],
  },
};

const ALT_ON = '\x1b[?1049h';
const ALT_OFF = '\x1b[?1049l';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const HIDE = '\x1b[?25l';
const SHOW = '\x1b[?25h';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rgb(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function readPackId() {
  if (process.env.ORBITAL_PACK && PACKS[process.env.ORBITAL_PACK]) {
    return process.env.ORBITAL_PACK;
  }
  try {
    const ws = path.join(process.cwd(), '.vscode', 'settings.json');
    const json = JSON.parse(fs.readFileSync(ws, 'utf8'));
    if (json['orbital.pack'] && PACKS[json['orbital.pack']]) {
      return json['orbital.pack'];
    }
  } catch {
    /* no workspace pack */
  }
  return 'mothership';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cols() {
  return Math.min(Math.max(process.stdout.columns || 80, 72), 100);
}

function rows() {
  return process.stdout.rows || 24;
}

function line(char = '─') {
  return char.repeat(cols() - 4);
}

function progressRibbon(progress, width, accent, accent2) {
  const filled = Math.max(0, Math.min(width, Math.round(easeInOut(progress) * width)));
  const head = filled > 0 ? accent2 + '█' + accent : '';
  const body = '█'.repeat(Math.max(0, filled - 1));
  const empty = '░'.repeat(width - filled);
  return `[${accent}${body}${head}${DIM}${empty}${RESET}${accent}]`;
}

function driftX(progress, amp) {
  return Math.round(Math.sin(easeInOut(progress) * Math.PI * 2) * amp);
}

function ufoLine(progress, hero) {
  const w = cols();
  const body = hero + '  ';
  const trail = progress > 0.35 ? '· · ·' : '';
  const maxPos = Math.max(0, w - body.length - trail.length - 8);
  const pos = Math.floor(easeInOut(Math.min(1, progress * 1.15)) * maxPos);
  return ' '.repeat(4 + pos) + body + trail;
}

function orbitRow(emojis, progress) {
  const amp = 3;
  const phase = easeInOut(progress) * Math.PI * 2;
  const parts = emojis.map((e, i) => {
    const pad = Math.max(0, Math.round(Math.sin(phase + i * 1.2) * amp) + amp);
    return ' '.repeat(pad) + e;
  });
  return '  ' + parts.join('  ');
}

function captionReveal(caption, progress) {
  const t = easeInOut(Math.max(0, Math.min(1, (progress - 0.12) / 0.35)));
  const n = Math.floor(t * caption.length);
  return caption.slice(0, n) + (t < 1 && n < caption.length ? '▌' : '');
}

function buildFrame(pack, packId, state) {
  const { progress, caption, sub, hero, streak } = state;
  const [r, g, b] = pack.tint;
  const [r2, g2, b2] = pack.accent2 || pack.tint;
  const accent = rgb(r, g, b);
  const accent2 = rgb(r2, g2, b2);
  const barW = cols() - 16;
  const opacityHold = Math.min(1, Math.max(0, (progress - 0.08) / 0.2));

  const content = [];
  content.push('');
  content.push(`${accent}${line('═')}${RESET}`);
  content.push(`${accent}${BOLD}  🛸 ORBITAL${RESET} ${DIM}·${RESET} ${pack.label}`);
  content.push(`${accent}${line('─')}${RESET}`);
  content.push('');

  if (progress > 0.05) {
    content.push(ufoLine(progress, hero));
    content.push('');
  }

  if (progress > 0.12) {
    const revealed = captionReveal(caption, progress);
    content.push(`  ${hero}  ${accent}${BOLD}${revealed}${RESET}`);
    content.push('');
  }

  if (progress > 0.4 && sub) {
    const subT = easeInOut(Math.min(1, (progress - 0.4) / 0.25));
    const dimSub = subT > 0.2 ? `${DIM}  ${sub}${RESET}` : '';
    if (dimSub) content.push(dimSub);
    content.push('');
  }

  if (progress > 0.28) {
    content.push(orbitRow(pack.emojis.slice(0, 4), progress));
    content.push('');
  }

  if (streak > 1 && progress > 0.55) {
    content.push(`${accent2}${BOLD}  🔥 ${streak} wins today${RESET}`);
    content.push('');
  }

  const pct = `${Math.min(100, Math.round(easeInOut(progress) * 100))}%`;
  content.push(
    `${DIM}  ${progressRibbon(progress, barW, accent, accent2)} ${pct}${RESET}`,
  );
  content.push(`${DIM}  continuous arc · ${packId} pack${RESET}`);
  content.push(`${accent}${line('═')}${RESET}`);
  content.push('');

  const basePad = Math.max(0, Math.floor(rows() / 2) - Math.floor(content.length / 2));
  const camera = Math.round(lerp(2, 0, easeInOut(Math.min(1, progress * 1.2))));
  const pad = Math.max(0, basePad - camera + driftX(progress, 0));
  void opacityHold;
  return '\n'.repeat(pad) + content.join('\n');
}

async function celebrate(options = {}) {
  const streak =
    typeof options.streak === 'number'
      ? options.streak
      : Number(process.env.ORBITAL_STREAK) || 0;

  if (!process.stdout.isTTY) {
    process.stdout.write(`\n🛸 ORBITAL · ${pick(PACKS.mothership.lines)}\n`);
    return;
  }

  const packId = readPackId();
  const pack = PACKS[packId];
  const caption = pick(pack.lines);
  const sub = pick(pack.subs);
  const hero = pick(pack.emojis);
  const frames = Math.ceil(DURATION_MS / FRAME_MS);

  process.stdout.write(HIDE);
  process.stdout.write(ALT_ON);
  process.stdout.write('\x1b[2J\x1b[H');

  for (let i = 0; i <= frames; i++) {
    const progress = i / frames;
    const frame = buildFrame(pack, packId, {
      progress,
      caption,
      sub,
      hero,
      streak,
    });
    process.stdout.write('\x1b[H\x1b[2J');
    process.stdout.write(frame);
    if (i < frames) {
      await sleep(FRAME_MS);
    }
  }

  process.stdout.write(SHOW);
  process.stdout.write(ALT_OFF);
}

export { celebrate };
