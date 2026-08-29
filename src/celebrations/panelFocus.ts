import * as vscode from 'vscode';

export type PanelReturnFocus = 'terminal' | 'none';

export interface PanelFocusSnapshot {
  returnFocus: PanelReturnFocus;
  activeTerminal?: vscode.Terminal;
}

export function capturePanelFocus(
  returnFocus?: PanelReturnFocus,
): PanelFocusSnapshot {
  const activeTerminal = vscode.window.activeTerminal;
  return {
    returnFocus: returnFocus ?? (activeTerminal ? 'terminal' : 'none'),
    activeTerminal: activeTerminal ?? undefined,
  };
}

export async function focusOrbitalView(
  vscodeApi: typeof vscode,
  viewId: string,
): Promise<void> {
  const commands = [
    `${viewId}.focus`,
    'workbench.view.extension.orbital-panel',
  ];
  for (const cmd of commands) {
    try {
      await vscodeApi.commands.executeCommand(cmd);
      return;
    } catch {
      /* try next */
    }
  }
}

export async function restorePanelFocus(
  vscodeApi: typeof vscode,
  snapshot: PanelFocusSnapshot,
): Promise<void> {
  if (snapshot.returnFocus !== 'terminal') {
    return;
  }

  if (snapshot.activeTerminal) {
    snapshot.activeTerminal.show(true);
    return;
  }

  try {
    await vscodeApi.commands.executeCommand('workbench.action.terminal.focus');
  } catch {
    /* optional in Cursor */
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForView(
  getView: () => vscode.WebviewView | undefined,
  ms = 2500,
): Promise<boolean> {
  const attempts = Math.ceil(ms / 100);
  for (let i = 0; i < attempts; i++) {
    if (getView()) {
      return true;
    }
    await sleep(100);
  }
  return false;
}
