import type { WinMomentDecision } from '../brain/winMoment';
import { getExperiencePack } from '../packs/experiencePacks';
import type { PackId } from '../packs/types';

/** Status bar only. Editor and syntax tokens are never written. */
export const PERIPHERAL_THEME_KEYS = ['statusBar.background', 'statusBar.foreground'] as const;

export interface ThemeFrame {
  /** Official workbench.colorTheme label. The host must not change it from this frame. */
  colorTheme: string;
  colorCustomizations: Record<string, string>;
  lockEditorTheme: true;
  reason: string;
}

export interface ThemeFrameInput {
  packId: PackId;
  typing: boolean;
  quietMode: boolean;
  show: boolean;
}

function contrastForeground(accent: string): string {
  const hex = accent.replace('#', '');
  if (hex.length < 6) {
    return '#041018';
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.62 ? '#041018' : '#F7F3EA';
}

/**
 * Pack theme stays the editor theme. A shown win may tint the status bar
 * unless the user is typing or in quiet mode.
 */
export function resolveThemeFrame(input: ThemeFrameInput): ThemeFrame {
  const pack = getExperiencePack(input.packId);
  const colorTheme = pack.themeLabel;
  if (!input.show || input.typing || input.quietMode) {
    const reason = !input.show
      ? 'no win → editor theme unchanged, status bar clear'
      : input.quietMode
        ? 'quiet → no status bar tint'
        : 'typing → no status bar tint';
    return { colorTheme, colorCustomizations: {}, lockEditorTheme: true, reason };
  }

  const accent = pack.visualTheme.tokens.accent;
  return {
    colorTheme,
    colorCustomizations: {
      'statusBar.background': accent,
      'statusBar.foreground': contrastForeground(accent),
    },
    lockEditorTheme: true,
    reason: 'shown win → peripheral status bar tint',
  };
}

export function themeFrameForMoment(
  packId: PackId,
  moment: WinMomentDecision,
  flags: { typing: boolean; quietMode: boolean },
): ThemeFrame {
  return resolveThemeFrame({
    packId,
    typing: flags.typing,
    quietMode: flags.quietMode,
    show: moment.show,
  });
}
