#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const STREAK_REL = '.vscode/orbital-streak.json';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Bump today's test-win streak; returns the new count. */
export function bumpStreak(cwd = process.cwd()) {
  const filePath = path.join(cwd, STREAK_REL);
  const today = todayKey();
  let count = 0;

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (parsed.day === today && typeof parsed.count === 'number') {
      count = parsed.count;
    }
  } catch {
    /* first run today */
  }

  count += 1;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ day: today, count }), 'utf8');
  return count;
}

export function readStreak(cwd = process.cwd()) {
  try {
    const parsed = JSON.parse(
      fs.readFileSync(path.join(cwd, STREAK_REL), 'utf8'),
    );
    if (parsed.day === todayKey() && typeof parsed.count === 'number') {
      return parsed.count;
    }
  } catch {
    /* no streak yet */
  }
  return 0;
}
