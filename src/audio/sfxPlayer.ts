import * as vscode from 'vscode';
import { getPack } from '../packs/registry';
import { PackId } from '../packs/types';

export function resolveSfxUri(
  pack: PackId,
  extensionUri: vscode.Uri,
  enabled: boolean,
  mutedPacks: PackId[],
): vscode.Uri | undefined {
  if (!enabled || mutedPacks.includes(pack)) return undefined;
  const file = getPack(pack).sfxFile;
  return vscode.Uri.joinPath(extensionUri, 'media', 'sfx', file);
}
