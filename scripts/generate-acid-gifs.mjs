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

function writeGif(filePath, kind) {
  const parts = [];
  parts.push(Buffer.from('GIF89a'));

  const header = Buffer.alloc(7);
  header.writeUInt16LE(W, 0);
  header.writeUInt16LE(H, 2);
  header[4] = 0x80 | 0x70 | 0x02; // global color table, 8-bit, 4 bits → 8 colors? 2^(N+1)=8 → N=2
  // Actually: size of GCT = 2^(N+1). For 8 colors N=2. We have 6 colors → pad to 8. N=2.
  header[5] = 0; // bg
  header[6] = 0; // aspect
  parts.push(header);

  const gct = Buffer.alloc(8 * 3);
  for (let i = 0; i < 8; i++) {
    const c = PALETTE[i] || [0, 0, 0];
    gct[i * 3] = c[0];
    gct[i * 3 + 1] = c[1];
    gct[i * 3 + 2] = c[2];
  }
  parts.push(gct);

  // Netscape loop
  parts.push(Buffer.from([0x21, 0xff, 0x0b]));
  parts.push(Buffer.from('NETSCAPE2.0'));
  parts.push(Buffer.from([0x03, 0x01, 0x00, 0x00, 0x00]));

  for (let f = 0; f < FRAMES; f++) {
    const t = f / FRAMES;
    const pixels = framePixels(kind, t);

    // Graphic Control Extension
    const gce = Buffer.alloc(8);
    gce[0] = 0x21;
    gce[1] = 0xf9;
    gce[2] = 0x04;
    gce[3] = 0x00;
    gce.writeUInt16LE(DELAY, 4);
    gce[6] = 0;
    gce[7] = 0;
    parts.push(gce);

    // Image Descriptor
    const id = Buffer.alloc(10);
    id[0] = 0x2c;
    id.writeUInt16LE(0, 1);
    id.writeUInt16LE(0, 3);
    id.writeUInt16LE(W, 5);
    id.writeUInt16LE(H, 7);
    id[9] = 0;
    parts.push(id);

    parts.push(lzwEncode(pixels, 3)); // min code size 3 for 8-color table
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
console.log(`\nGIFs written to ${OUT}`);
