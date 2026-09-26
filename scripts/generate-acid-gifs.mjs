#!/usr/bin/env node
/**
 * Generate short Acid Scrapbook celebration GIFs (indexed-color animated GIF89a).
 * Run: node scripts/generate-acid-gifs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'media', 'gifs', 'acid');
const W = 96;
const H = 96;
const FRAMES = 16;
const DELAY = 6; // centiseconds

const PALETTE = [
  [12, 10, 15], // bg ink
  [214, 255, 60], // lime
  [255, 45, 149], // magenta
  [255, 246, 232], // cream
  [94, 242, 255], // cyan
  [40, 36, 48], // dim
];

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function dist(x, y, cx, cy) {
  const dx = x - cx;
  const dy = y - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function framePixels(kind, t) {
  const e = easeInOut(t);
  const pixels = new Uint8Array(W * H);
  const cx = W / 2 + Math.sin(e * Math.PI * 2) * 10;
  const cy = H / 2 + Math.cos(e * Math.PI * 2) * 8;
  const cx2 = W / 2 + Math.cos(e * Math.PI * 2) * 14;
  const cy2 = H / 2 + Math.sin(e * Math.PI * 2) * 10;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let idx = 0;
      const d1 = dist(x, y, cx, cy);
      const d2 = dist(x, y, cx2, cy2);

      if (kind === 'sticker-orbit') {
        if (d1 < 18 + Math.sin(e * Math.PI * 2) * 3) idx = 1;
        else if (d2 < 12) idx = 2;
        else if (Math.abs(y - H / 2) < 2 && x > 20 && x < 76) idx = 3;
        else if ((x + y + Math.floor(e * 8)) % 17 === 0) idx = 5;
      } else if (kind === 'pin-drift') {
        if (d1 < 10) idx = 2;
        else if (d1 < 16) idx = 1;
        else if (Math.abs(y - (H * 0.65 + Math.sin(e * Math.PI) * 4)) < 3 && x > 18 && x < 78) idx = 1;
        else if (d2 < 8) idx = 4;
      } else {
        // collage-pulse
        const pulse = 14 + e * 8;
        if (d1 < pulse) idx = t < 0.5 ? 1 : 2;
        else if (d2 < 11) idx = 4;
        else if (x > 12 && x < 84 && y > 70 && y < 78) idx = 3;
        else if ((x * 3 + y * 5) % 23 === 0) idx = 5;
      }

      pixels[y * W + x] = idx;
    }
  }
  return pixels;
}

// Minimal GIF89a writer (global palette, animated frames)
function lzwEncode(indexStream, minCodeSize) {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoi + 1;
  const maxCode = () => 1 << codeSize;

  const dict = new Map();
  const resetDict = () => {
    dict.clear();
    for (let i = 0; i < clear; i++) dict.set(String.fromCharCode(i), i);
    nextCode = eoi + 1;
    codeSize = minCodeSize + 1;
  };
  resetDict();

  const outBits = [];
  let bitBuf = 0;
  let bitCount = 0;
  const writeCode = (code) => {
    bitBuf |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      outBits.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bitCount -= 8;
    }
  };

  writeCode(clear);
  let w = String.fromCharCode(indexStream[0]);
  for (let i = 1; i < indexStream.length; i++) {
    const k = String.fromCharCode(indexStream[i]);
    const wk = w + k;
    if (dict.has(wk)) {
      w = wk;
    } else {
      writeCode(dict.get(w));
      if (nextCode < 4096) {
        dict.set(wk, nextCode++);
        if (nextCode === maxCode() + 1 && codeSize < 12) codeSize++;
      } else {
        writeCode(clear);
        resetDict();
      }
      w = k;
    }
  }
  writeCode(dict.get(w));
  writeCode(eoi);
  if (bitCount > 0) outBits.push(bitBuf & 0xff);

  // pack into sub-blocks
  const blocks = [];
  for (let i = 0; i < outBits.length; i += 255) {
    const slice = outBits.slice(i, i + 255);
    blocks.push(Buffer.from([slice.length, ...slice]));
  }
  blocks.push(Buffer.from([0]));
  return Buffer.concat([Buffer.from([minCodeSize]), ...blocks]);
}

function writeGif(filePath, kind, opt = {}) {
  const width = opt.width ?? W;
  const height = opt.height ?? H;
  const palette = opt.palette ?? PALETTE;
  const frameCount = opt.frames ?? FRAMES;
  const pixelsFor = opt.pixels ?? ((t) => framePixels(kind, t));
  const parts = [];
  parts.push(Buffer.from('GIF89a'));

  const header = Buffer.alloc(7);
  header.writeUInt16LE(width, 0);
  header.writeUInt16LE(height, 2);
  header[4] = 0x80 | 0x70 | 0x02;
  header[5] = 0;
  header[6] = 0;
  parts.push(header);

  const gct = Buffer.alloc(8 * 3);
  for (let i = 0; i < 8; i++) {
    const c = palette[i] || [0, 0, 0];
    gct[i * 3] = c[0];
    gct[i * 3 + 1] = c[1];
    gct[i * 3 + 2] = c[2];
  }
  parts.push(gct);

  parts.push(Buffer.from([0x21, 0xff, 0x0b]));
  parts.push(Buffer.from('NETSCAPE2.0'));
  parts.push(Buffer.from([0x03, 0x01, 0x00, 0x00, 0x00]));

  for (let f = 0; f < frameCount; f++) {
    const t = f / frameCount;
    const pixels = pixelsFor(t);

    const gce = Buffer.alloc(8);
    gce[0] = 0x21;
    gce[1] = 0xf9;
    gce[2] = 0x04;
    gce[3] = 0x00;
    gce.writeUInt16LE(DELAY, 4);
    gce[6] = 0;
    gce[7] = 0;
    parts.push(gce);

    const id = Buffer.alloc(10);
    id[0] = 0x2c;
    id.writeUInt16LE(0, 1);
    id.writeUInt16LE(0, 3);
    id.writeUInt16LE(width, 5);
    id.writeUInt16LE(height, 7);
    id[9] = 0;
    parts.push(id);

    parts.push(lzwEncode(pixels, 3));
  }

  parts.push(Buffer.from([0x3b]));
  fs.writeFileSync(filePath, Buffer.concat(parts));
}

fs.mkdirSync(OUT, { recursive: true });
for (const kind of ['sticker-orbit', 'pin-drift', 'collage-pulse']) {
  const file = path.join(OUT, `${kind}.gif`);
  writeGif(file, kind);
  console.log(`✓ ${kind}.gif (${(fs.statSync(file).size / 1024).toFixed(1)} KB)`);
}
const GIF_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'media', 'gifs');
const BW = 160;
const BH = 96;

function fillScene(pixels, w, h, paint) {
  pixels.fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      pixels[y * w + x] = paint(x, y);
    }
  }
  return pixels;
}

function ellipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

const PACK_SCENES = {
  mothership: {
    palette: [[4, 16, 24], [28, 255, 154], [180, 255, 220], [8, 40, 48], [255, 246, 232], [20, 80, 70], [0, 0, 0], [0, 0, 0]],
    paint(t) {
      const buf = new Uint8Array(BW * BH);
      const lift = Math.sin(t * Math.PI * 2) * 8;
      return fillScene(buf, BW, BH, (x, y) => {
        if (ellipse(x, y, 80, 42 + lift, 36, 12)) return 1;
        if (ellipse(x, y, 80, 38 + lift, 14, 8)) return 2;
        if (Math.abs(x - 80) < 10 && y > 50 + lift && y < 88) return 5;
        if ((x + y) % 28 === 0) return 4;
        return 0;
      });
    },
  },
  glitch: {
    palette: [[8, 6, 12], [184, 255, 64], [255, 45, 149], [94, 242, 255], [30, 24, 36], [255, 246, 232], [0, 0, 0], [0, 0, 0]],
    paint(t) {
      const buf = new Uint8Array(BW * BH);
      const shift = Math.floor(Math.sin(t * Math.PI * 2) * 6);
      return fillScene(buf, BW, BH, (x, y) => {
        if (y % 8 === 0) return 4;
        const bar = (x + shift + y) % 24 < 6;
        if (bar && y > 28 && y < 68) return y % 2 === 0 ? 2 : 3;
        if ((x * 3 + Math.floor(t * 16)) % 31 === 0) return 1;
        return 0;
      });
    },
  },
  soft: {
    palette: [[255, 236, 220], [244, 162, 97], [255, 214, 186], [94, 242, 255], [255, 246, 232], [180, 120, 90], [0, 0, 0], [0, 0, 0]],
    paint(t) {
      const buf = new Uint8Array(BW * BH);
      const drift = Math.sin(t * Math.PI * 2) * 10;
      return fillScene(buf, BW, BH, (x, y) => {
        if (ellipse(x, y, 80, 48 + drift * 0.3, 22, 14)) return 1;
        if (ellipse(x, y, 40 + drift, 24, 3, 3) || ellipse(x, y, 120 - drift, 30, 2, 2)) return 3;
        return 0;
      });
    },
  },
  root: {
    palette: [[4, 8, 4], [51, 255, 102], [16, 48, 20], [180, 255, 180], [8, 16, 8], [255, 255, 255], [0, 0, 0], [0, 0, 0]],
    paint(t) {
      const buf = new Uint8Array(BW * BH);
      const drop = Math.floor(t * BH);
      return fillScene(buf, BW, BH, (x, y) => {
        const col = x % 16 === 4 || x % 16 === 12;
        if (col && (y + drop) % 10 < 4) return 1;
        if (ellipse(x, y, 80, 48, 8, 8)) return 3;
        return 0;
      });
    },
  },
};

const NAMES = {
  mothership: ['ufo-beam', 'alien-wave', 'saucer-lift'],
  glitch: ['static-burst', 'pixel-glitch', 'vhs-tracking'],
  soft: ['floating-ufo', 'sparkle-drift', 'cozy-stars'],
  root: ['matrix-rain', 'hacker-pulse', 'shell-access'],
};

for (const [pack, scene] of Object.entries(PACK_SCENES)) {
  const dir = path.join(GIF_ROOT, pack);
  fs.mkdirSync(dir, { recursive: true });
  for (const name of NAMES[pack]) {
    const file = path.join(dir, `${name}.gif`);
    writeGif(file, name, {
      width: BW,
      height: BH,
      palette: scene.palette,
      pixels: scene.paint,
    });
    console.log(`✓ ${pack}/${name}.gif`);
  }
}

console.log(`\nGIFs written to ${OUT}`);
