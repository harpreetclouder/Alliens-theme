import * as vscode from 'vscode';
import { CELEBRATION_DURATION_MS } from '../celebrations/durations';
import { orbitalLog } from '../util/log';
import { PERIPHERAL_THEME_KEYS, type ThemeFrame } from './themeFrame';

const SNAPSHOT_KEY = 'orbital.themePeripheralSnapshot';

interface PeripheralSnapshot {
  hadBackground: boolean;
  hadForeground: boolean;
  background?: string;
  foreground?: string;
}

/**
 * Applies a theme frame to the status bar only, then restores the previous colors.
 * Does not change workbench.colorTheme.
 */
export class ThemeHost {
  private snapshot: PeripheralSnapshot | undefined;
  private clearTimer: ReturnType<typeof setTimeout> | undefined;
  private painted = false;

  constructor(private readonly ctx: vscode.ExtensionContext) {
    const saved = ctx.globalState.get<PeripheralSnapshot>(SNAPSHOT_KEY);
    if (saved) {
      this.snapshot = saved;
      void this.restore();
    }
  }

  sync(frame: ThemeFrame): void {
    if (Object.keys(frame.colorCustomizations).length === 0) {
      void this.restore();
      return;
    }
    void this.paint(frame);
  }

  dispose(): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }
    void this.restore();
  }

  private async paint(frame: ThemeFrame): Promise<void> {
    try {
      await this.paintUnsafe(frame);
    } catch (err) {
      orbitalLog('Theme frame skipped', String(err));
    }
  }

  private async paintUnsafe(frame: ThemeFrame): Promise<void> {
    const config = vscode.workspace.getConfiguration('workbench');
    const current = { ...(config.get<Record<string, string>>('colorCustomizations') ?? {}) };
    if (!this.snapshot) {
      this.snapshot = {
        hadBackground: Object.prototype.hasOwnProperty.call(current, 'statusBar.background'),
        hadForeground: Object.prototype.hasOwnProperty.call(current, 'statusBar.foreground'),
        background: current['statusBar.background'],
        foreground: current['statusBar.foreground'],
      };
      await this.ctx.globalState.update(SNAPSHOT_KEY, this.snapshot);
    }
    const next = { ...current, ...frame.colorCustomizations };
    await config.update('colorCustomizations', next, vscode.ConfigurationTarget.Global);
    this.painted = true;
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }
    this.clearTimer = setTimeout(() => {
      void this.restore();
    }, CELEBRATION_DURATION_MS.overlay);
    orbitalLog('Theme frame', frame.reason);
  }

  private async restore(): Promise<void> {
    try {
      await this.restoreUnsafe();
    } catch (err) {
      orbitalLog('Theme restore skipped', String(err));
    }
  }

  private async restoreUnsafe(): Promise<void> {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = undefined;
    }
    if (!this.painted && !this.snapshot) {
      return;
    }
    const config = vscode.workspace.getConfiguration('workbench');
    const current = { ...(config.get<Record<string, string>>('colorCustomizations') ?? {}) };
    const snap = this.snapshot;
    for (const key of PERIPHERAL_THEME_KEYS) {
      delete current[key];
    }
    if (snap?.hadBackground && snap.background) {
      current['statusBar.background'] = snap.background;
    }
    if (snap?.hadForeground && snap.foreground) {
      current['statusBar.foreground'] = snap.foreground;
    }
    await config.update('colorCustomizations', current, vscode.ConfigurationTarget.Global);
    this.snapshot = undefined;
    this.painted = false;
    await this.ctx.globalState.update(SNAPSHOT_KEY, undefined);
  }
}
