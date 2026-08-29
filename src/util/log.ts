import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

function timestamp(): string {
  return new Date().toLocaleTimeString(undefined, { hour12: false });
}

export function orbitalLog(message: string, detail?: string): void {
  if (!channel) {
    channel = vscode.window.createOutputChannel('Orbital');
  }
  const line = detail ? `${message} — ${detail}` : message;
  channel.appendLine(`[${timestamp()}] ${line}`);
}

export function orbitalLogSkip(reason: string, context: string): void {
  orbitalLog(`Skipped: ${context}`, reason);
}

export function orbitalLogCelebrate(
  pack: string,
  kind: string,
  surface: string,
  extras?: string,
): void {
  const detail = extras ? `${surface} · ${extras}` : surface;
  orbitalLog(`Celebration · ${pack} · ${kind}`, detail);
}

export function showOrbitalOutput(): void {
  if (!channel) {
    channel = vscode.window.createOutputChannel('Orbital');
  }
  channel.show(true);
}
