import * as vscode from 'vscode';
import { applyPack, pickPack } from '../commands/registerCommands';
import type { CelebrationEngine } from '../celebrations/engine';
import { runVerificationHarness } from '../verification/harness';
import { formatVerifySummary } from '../verification/summary';

const ONBOARDED_KEY = 'orbital.onboarded';
const ONBOARD_VERSION = 2; // bump to re-prompt setup wizard once

export async function runFirstRunIfNeeded(
  context: vscode.ExtensionContext,
  engine?: CelebrationEngine,
): Promise<void> {
  const done = context.globalState.get<number>(ONBOARDED_KEY);
  if (done === ONBOARD_VERSION) {
    return;
  }

  const start = await vscode.window.showInformationMessage(
    'Orbital setup — configure celebrations once so commits, tests, and level HUD just work.',
    'Set up Orbital',
    'Later',
  );
  if (start !== 'Set up Orbital') {
    return;
  }

  const packId = await pickPack();
  if (!packId) {
    return;
  }

  const intensity = await vscode.window.showQuickPick(
    [
      { label: 'Normal', description: 'Panel commits · terminal tests', value: 'normal' as const },
      { label: 'Hype', description: 'More overlays · louder wins', value: 'hype' as const },
      { label: 'Chill', description: 'Status bar only', value: 'chill' as const },
    ],
    { placeHolder: 'Celebration intensity' },
  );
  if (!intensity) {
    return;
  }

  const commitSurface = await vscode.window.showQuickPick(
    [
      { label: 'Overlay (fullscreen)', value: 'overlay' as const },
      { label: 'Panel (bottom Orbital tab)', value: 'panel' as const },
    ],
    { placeHolder: 'Where should commit celebrations appear?' },
  );
  if (!commitSurface) {
    return;
  }

  const soundChoice = await vscode.window.showQuickPick(
    [
      { label: 'Yes — play SFX', value: true },
      { label: 'No — silent', value: false },
    ],
    { placeHolder: 'Celebration sounds?' },
  );
  if (soundChoice === undefined) {
    return;
  }

  const orbitChoice = await vscode.window.showQuickPick(
    [
      { label: 'Yes — show level + streak on status bar', value: true },
      { label: 'No', value: false },
    ],
    { placeHolder: 'Enable Orbital Orbit (XP / level)?' },
  );
  if (orbitChoice === undefined) {
    return;
  }

  const giphy = await vscode.window.showInputBox({
    title: 'Giphy SDK key (optional)',
    prompt: 'Paste from https://developers.giphy.com/dashboard/ — leave empty for local GIFs only',
    placeHolder: 'SDK / API key',
    ignoreFocusOut: true,
    password: true,
  });
  if (giphy === undefined) {
    return;
  }

  await applyPack(packId);

  const config = vscode.workspace.getConfiguration('orbital');
  await config.update('sound.enabled', soundChoice.value, vscode.ConfigurationTarget.Global);
  await config.update('celebrations.enabled', true, vscode.ConfigurationTarget.Global);
  await config.update('celebrations.intensity', intensity.value, vscode.ConfigurationTarget.Global);
  await config.update('celebrations.display', commitSurface.value, vscode.ConfigurationTarget.Global);
  await config.update(
    'celebrations.surfaces',
    { commit: commitSurface.value, build: commitSurface.value, debug: 'panel' },
    vscode.ConfigurationTarget.Global,
  );
  await config.update('celebrations.triggers.commit', true, vscode.ConfigurationTarget.Global);
  await config.update('celebrations.triggers.tests', true, vscode.ConfigurationTarget.Global);
  await config.update('orbit.enabled', orbitChoice.value, vscode.ConfigurationTarget.Global);
  if (giphy.trim()) {
    await config.update('giphy.sdkKey', giphy.trim(), vscode.ConfigurationTarget.Global);
  }

  await context.globalState.update(ONBOARDED_KEY, ONBOARD_VERSION);

  const verify = await vscode.window.showInformationMessage(
    'Orbital is configured. Run a quick live verification? (preview + commit path)',
    'Verify now',
    'Skip',
  );

  if (verify === 'Verify now' && engine) {
    const results = await runVerificationHarness(engine, { playVisuals: true });
    void vscode.window.showInformationMessage(formatVerifySummary(results));
  } else {
    void vscode.window.showInformationMessage(
      'Setup complete. Tip: Command Palette → “Orbital: Verify Celebrations” anytime.',
    );
  }
}

/** Force wizard again (also used from command). */
export async function resetAndRunSetup(
  context: vscode.ExtensionContext,
  engine: CelebrationEngine,
): Promise<void> {
  await context.globalState.update(ONBOARDED_KEY, undefined);
  await runFirstRunIfNeeded(context, engine);
}
