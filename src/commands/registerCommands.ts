import * as vscode from 'vscode';
import { CelebrationEngine } from '../celebrations/engine';
import { PACKS } from '../packs/registry';
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
  _context: vscode.ExtensionContext,
  engine: CelebrationEngine,
): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('orbital.switchPack', async () => {
      const packId = await pickPack();
      if (packId) {
        await applyPack(packId);
      }
    }),
    vscode.commands.registerCommand('orbital.previewCelebration', () => {
      engine.preview();
    }),
    vscode.commands.registerCommand('orbital.toggleSound', async () => {
      const config = vscode.workspace.getConfiguration('orbital');
      const current = config.get<boolean>('sound.enabled', false);
      await config.update('sound.enabled', !current, vscode.ConfigurationTarget.Global);
    }),
  ];
}
