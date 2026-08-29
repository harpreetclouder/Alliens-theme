import * as vscode from 'vscode';
import { applyPack, pickPack } from '../commands/registerCommands';

const ONBOARDED_KEY = 'orbital.onboarded';

export async function runFirstRunIfNeeded(context: vscode.ExtensionContext): Promise<void> {
  if (context.globalState.get<boolean>(ONBOARDED_KEY)) {
    return;
  }

  const packId = await pickPack();
  if (!packId) {
    return;
  }

  const soundChoice = await vscode.window.showQuickPick(
    [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
    { placeHolder: 'Enable celebration sounds?' },
  );

  if (soundChoice === undefined) {
    return;
  }

  await applyPack(packId);

  const config = vscode.workspace.getConfiguration('orbital');
  await config.update('sound.enabled', soundChoice.value, vscode.ConfigurationTarget.Global);
  await context.globalState.update(ONBOARDED_KEY, true);
}
