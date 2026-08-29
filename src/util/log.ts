import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function orbitalLog(message: string): void {
  if (!channel) {
    channel = vscode.window.createOutputChannel('Orbital');
  }
  channel.appendLine(message);
}
