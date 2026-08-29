#!/usr/bin/env node
/**
 * Fullscreen in-terminal celebration (same terminal as npm test).
 * Animated ASCII + progress bar; alternate screen preserves test output.
 */
import fs from 'node:fs';
import path from 'node:path';

const DURATION_MS = 5000;
const FRAME_MS = 100;

const PACKS = {
  mothership: {
    label: 'MOTHERSHIP OS',
    tint: [28, 255, 154],
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
    lines: ['TESTS ✓ YEETED', 'SIGNAL CLEAR · NO STATIC', 'ALL GREEN · SHIP IT'],
    subs: ['tape quality: pristine', 'certified unhinged'],
    emojis: ['👾', '📺', '⚡', '💾'],
  },
  soft: {
    label: 'SOFT ABDUCTION',
    tint: [244, 162, 97],
    lines: ['tests passed · cozy ✓', 'all green · soft landing', 'nice work · orbit calm'],
    subs: ['you earned a soft win', 'the cow is proud'],
    emojis: ['🛸', '🐄', '☁️', '✨'],
  },
  root: {
    label: 'ROOT ACCESS',
    tint: [51, 255, 102],
    lines: ['tests pwned · exit 0', 'all tests · root access granted', 'suite owned · 0xOK'],
    subs: ['shell access: granted', 'kernel says gg'],
    emojis: ['💻', '🖥️', '🔓', '⚙️'],
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

function progressBar(progress, width) {
  const filled = Math.max(0, Math.min(width, Math.round(progress * width)));
  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}]`;
}

function ufoLine(progress) {
  const w = cols();
  const body = '(>◡<)>';
  const beam = progress > 0.55 ? '  ' + '▼'.repeat(3) : '';
  const maxPos = Math.max(0, w - body.length - beam.length - 6);
  const pos = Math.floor(progress * maxPos);
  return ' '.repeat(4 + pos) + body + beam;
}

function orbitRow(emojis, frame) {
  const slots = ['  ', '  ', '  ', '  '];
  const positions = [
    frame % 4,
    (frame + 1) % 4,
    (frame + 2) % 4,
    (frame + 3) % 4,
  ];
  emojis.forEach((e, i) => {
    slots[positions[i]] = e + ' ';
  });
  return '  ' + slots.join('');
}

function buildFrame(pack, packId, state) {
  const { progress, frame, caption, sub, hero, streak } = state;
  const [r, g, b] = pack.tint;
  const accent = rgb(r, g, b);
  const barW = cols() - 16;
  const streakLine =
    streak > 1
      ? `${accent}${BOLD}  🔥 ${streak} wins today${RESET}`
      : '';

  const content = [];
  content.push('');
  content.push(`${accent}${line('═')}${RESET}`);
  content.push(`${accent}${BOLD}  🛸 ORBITAL${RESET} ${DIM}·${RESET} ${pack.label}`);
  content.push(`${accent}${line('─')}${RESET}`);
  content.push('');

  if (progress > 0.08) {
    content.push(ufoLine(Math.min(1, progress * 1.4)));
    content.push('');
  }

  if (progress > 0.22) {
    content.push(`  ${hero}  ${accent}${BOLD}${caption}${RESET}`);
    content.push('');
  }

  if (progress > 0.38 && sub) {
    content.push(`${DIM}  ${sub}${RESET}`);
    content.push('');
  }

  if (progress > 0.5) {
    content.push(orbitRow(pack.emojis.slice(0, 4), frame));
    content.push('');
  }

  if (streakLine && progress > 0.62) {
    content.push(streakLine);
    content.push('');
  }

  const pct = `${Math.min(100, Math.round(progress * 100))}%`;
  content.push(`${DIM}  ${progressBar(progress, barW)} ${pct}${RESET}`);
  content.push(`${DIM}  integrated terminal · ${packId} pack${RESET}`);
  content.push(`${accent}${line('═')}${RESET}`);
  content.push('');

  const pad = Math.max(0, Math.floor(rows() / 2) - Math.floor(content.length / 2));
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
      frame: i,
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
