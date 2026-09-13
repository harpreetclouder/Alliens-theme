import * as vscode from 'vscode';

export interface StatusBarShowArgs {
  emoji: string;
  caption: string;
  subline?: string;
  streak?: number;
  durationMs: number;
}

/** Persistent orbit HUD text: `L{n} · 🔥{streak}`. */
export function formatOrbitCrumb(level: number, streakDays: number): string {
  return `$(rocket) L${level} · 🔥${streakDays}`;
}

export class StatusBarCelebration {
  private readonly whisperItem: vscode.StatusBarItem;
  private readonly orbitCrumbItem: vscode.StatusBarItem;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(vscodeApi: typeof vscode) {
    this.whisperItem = vscodeApi.window.createStatusBarItem(
      vscodeApi.StatusBarAlignment.Right,
      100,
    );
    this.whisperItem.name = 'Orbital Celebration';

    this.orbitCrumbItem = vscodeApi.window.createStatusBarItem(
      vscodeApi.StatusBarAlignment.Right,
      1000,
    );
    this.orbitCrumbItem.name = 'Orbital Level';
    this.orbitCrumbItem.tooltip = 'Orbital · level and streak (click to open panel)';
    this.orbitCrumbItem.command = 'orbital.openPanel';
  }

  setOrbitCrumb(level: number, streakDays: number): void {
    this.orbitCrumbItem.text = formatOrbitCrumb(level, streakDays);
    this.orbitCrumbItem.show();
  }

  clearOrbitCrumb(): void {
    this.orbitCrumbItem.hide();
  }

  show(args: StatusBarShowArgs): void {
    const streak =
      args.streak && args.streak > 1 ? ` · 🔥 ${args.streak} today` : '';
    this.whisperItem.text = `${args.emoji} ${args.caption}${streak}`;
    this.whisperItem.tooltip = args.subline
      ? `Orbital · ${args.subline}`
      : 'Orbital celebration';
    this.whisperItem.show();

    if (this.hideTimer !== undefined) {
      clearTimeout(this.hideTimer);
    }
    this.hideTimer = setTimeout(() => this.hideWhisper(), args.durationMs);
  }

  hideWhisper(): void {
    this.whisperItem.hide();
  }

  dispose(): void {
    if (this.hideTimer !== undefined) {
      clearTimeout(this.hideTimer);
    }
    this.whisperItem.dispose();
    this.orbitCrumbItem.dispose();
  }
}
