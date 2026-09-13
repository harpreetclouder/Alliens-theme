import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { PACKS } from '../packs/registry';
import { orbitalLog } from '../util/log';
import type { PackId } from '../packs/types';

export const PACK_THEME_LABELS: Record<PackId, string> = {
  mothership: 'Orbital — Mothership OS',
  glitch: 'Orbital — Glitch Transmission',
  soft: 'Orbital — Soft Abduction',
  root: 'Orbital — Root Access',
};

export async function pickPack(): Promise<PackId | undefined> {
  const items = (Object.keys(PACKS) as PackId[]).map((id) => ({
    label: PACKS[id].label,
    description: PACK_THEME_LABELS[id],
    id,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Choose your Orbital pack',
  });

  return picked?.id;
}

export async function applyPack(packId: PackId): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  await config.update('orbital.pack', packId, vscode.ConfigurationTarget.Global);
  await config.update(
    'workbench.colorTheme',
    PACK_THEME_LABELS[packId],
    vscode.ConfigurationTarget.Global,
  );
}

export function registerCommands(
  context: vscode.ExtensionContext,
  engine: CelebrationEngine,
): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('orbital.switchPack', async () => {
      const packId = await pickPack();
      if (packId) {
        await applyPack(packId);
        engine.handle('pack');
      }
    }),
    vscode.commands.registerCommand('orbital.previewCelebration', () => {
      orbitalLog('Preview command invoked', 'terminal fullscreen');
      const script = vscode.Uri.joinPath(context.extensionUri, 'scripts', 'terminal-celebration.mjs');
      const term = vscode.window.activeTerminal ?? vscode.window.createTerminal('Orbital');
      term.show(true);
      term.sendText(`node "${script.fsPath}"`, true);
      engine.preview();
    }),
    vscode.commands.registerCommand('orbital.signalTestPass', () => {
      engine.handle('tests', { returnFocus: 'terminal' });
    }),
    vscode.commands.registerCommand('orbital.toggleSound', async () => {
      const config = vscode.workspace.getConfiguration('orbital');
      const current = config.get<boolean>('sound.enabled', false);
      await config.update('sound.enabled', !current, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('orbital.previewCommitCelebration', () => {
      orbitalLog('Preview commit celebration', 'panel / overlay');
      engine.handle('commit');
    }),
    vscode.commands.registerCommand('orbital.openPanel', () => {
      void vscode.commands.executeCommand('orbital.celebrationView.focus');
    }),
  ];
}
