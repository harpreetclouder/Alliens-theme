import { PackId } from '../packs/types';
import { getPack } from '../packs/registry';

export interface TerminalArtInput {
  pack: PackId;
  caption: string;
  subline?: string;
  emoji: string;
  orbitEmojis?: [string, string, string];
  tint: string;
  loopId: string;
  gifId?: string;
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function fgRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

function line(width: number, char = '─'): string {
  return char.repeat(width);
}

export function buildTerminalCelebration(input: TerminalArtInput): string {
  const pack = getPack(input.pack);
  const accent = fgRgb(input.tint);
  const orbit = input.orbitEmojis?.join('  ') ?? '';
  const visual = input.gifId ? `gif · ${input.gifId}` : `loop · ${input.loopId}`;
  const sub = input.subline ? `\n${DIM}  ${input.subline}${RESET}` : '';

  return [
    '',
    `${accent}${line(44, '━')}${RESET}`,
    `${accent}${BOLD}  🛸 ORBITAL${RESET} ${DIM}·${RESET} ${pack.label.toUpperCase()}`,
    `${accent}${line(44, '─')}${RESET}`,
    `  ${input.emoji}  ${BOLD}${accent}${input.caption}${RESET}`,
    sub,
    orbit ? `\n  ${orbit}` : '',
    `\n${DIM}  ${visual}${RESET}`,
    `${accent}${line(44, '━')}${RESET}`,
    '',
  ]
    .filter((row) => row !== undefined)
    .join('\n');
}

/** Safe print via node (handles emoji + ANSI, avoids shell escaping). */
export function shellPrintCommand(content: string): string {
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  return `node -e "process.stdout.write(Buffer.from('${b64}','base64'))"`;
}
