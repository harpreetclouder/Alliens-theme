#!/usr/bin/env node
/**
 * Generate short pack-themed SFX as 16-bit mono WAV files.
 * Run: node scripts/generate-sfx.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'media',
  'sfx',
);

function writeWav(filePath, samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (SAMPLE_RATE * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

function env(t, duration, attack = 0.02, release = 0.15) {
  if (t < attack) return t / attack;
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return 1;
}

function concat(parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function silence(seconds) {
  return new Float32Array(Math.floor(seconds * SAMPLE_RATE));
}

function sine(freq, duration, gain = 0.35, attack = 0.02, release = 0.12) {
  const len = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    out[i] = Math.sin(2 * Math.PI * freq * t) * gain * env(t, duration, attack, release);
  }
  return out;
}

function sweep(startHz, endHz, duration, gain = 0.3) {
  const len = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;
    const freq = startHz + (endHz - startHz) * progress;
    out[i] = Math.sin(2 * Math.PI * freq * t) * gain * env(t, duration, 0.05, 0.2);
  }
  return out;
}

function noiseBurst(duration, gain = 0.25) {
  const len = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    out[i] = (Math.random() * 2 - 1) * gain * env(t, duration, 0.005, 0.08);
  }
  return out;
}

function squareBeep(freq, duration, gain = 0.22) {
  const len = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const phase = (freq * t) % 1;
    const sq = phase < 0.5 ? 1 : -1;
    out[i] = sq * gain * env(t, duration, 0.005, 0.04);
  }
  return out;
}

/** Ethereal uplink beam — rising sweep + shimmer */
function mothership() {
  return concat([
    sweep(280, 920, 0.55, 0.28),
    sine(1046, 0.18, 0.18, 0.01, 0.1),
    sine(1318, 0.22, 0.14, 0.01, 0.14),
  ]);
}

/** VHS static burst + digital tick */
function glitch() {
  return concat([
    noiseBurst(0.12, 0.35),
    squareBeep(220, 0.06, 0.2),
    silence(0.03),
    noiseBurst(0.08, 0.28),
    squareBeep(440, 0.05, 0.18),
    squareBeep(880, 0.04, 0.15),
  ]);
}

/** Cozy two-note chime */
function soft() {
  return concat([
    sine(392, 0.32, 0.28, 0.02, 0.18),
    silence(0.06),
    sine(523, 0.38, 0.26, 0.02, 0.22),
    sine(659, 0.45, 0.12, 0.02, 0.25),
  ]);
}

/** Terminal access granted — double beep */
function root() {
  return concat([
    squareBeep(880, 0.09, 0.24),
    silence(0.05),
    squareBeep(1174, 0.11, 0.26),
    silence(0.04),
    squareBeep(880, 0.07, 0.2),
  ]);
}

/** Paper flutter + soft peel click */
function acid() {
  return concat([
    noiseBurst(0.05, 0.18),
    sweep(420, 780, 0.28, 0.22),
    silence(0.04),
    sine(990, 0.12, 0.2, 0.005, 0.08),
    sine(1320, 0.18, 0.12, 0.01, 0.12),
  ]);
}

const PACKS = {
  mothership: mothership,
  glitch: glitch,
  soft: soft,
  root: root,
  acid: acid,
};

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [name, fn] of Object.entries(PACKS)) {
  const samples = fn();
  const file = path.join(OUT_DIR, `${name}.wav`);
  writeWav(file, samples);
  const kb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log(`✓ ${name}.wav (${kb} KB, ${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);
}

console.log(`\nSFX written to ${OUT_DIR}`);
