import * as vscode from 'vscode';

export interface StatusBarShowArgs {
  emoji: string;
  caption: string;
  subline?: string;
  streak?: number;
  durationMs: number;
}

export class StatusBarCelebration {
  private readonly item: vscode.StatusBarItem;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(vscodeApi: typeof vscode) {
    this.item = vscodeApi.window.createStatusBarItem(
      vscodeApi.StatusBarAlignment.Right,
      100,
    );
    this.item.name = 'Orbital Celebration';
  }

  show(args: StatusBarShowArgs): void {
    const streak =
      args.streak && args.streak > 1 ? ` · 🔥 ${args.streak} today` : '';
    this.item.text = `${args.emoji} ${args.caption}${streak}`;
    this.item.tooltip = args.subline
      ? `Orbital · ${args.subline}`
      : 'Orbital celebration';
    this.item.show();

    if (this.hideTimer !== undefined) {
      clearTimeout(this.hideTimer);
    }
    this.hideTimer = setTimeout(() => this.hide(), args.durationMs);
  }

  hide(): void {
    this.item.hide();
  }

  dispose(): void {
    if (this.hideTimer !== undefined) {
      clearTimeout(this.hideTimer);
    }
    this.item.dispose();
  }
}
