import * as vscode from 'vscode';
import type { CelebrationEngine } from '../celebrations/engine';
import { orbitalLog } from '../util/log';
import {
  VERIFY_REQUEST_REL,
  VERIFY_RESULT_REL,
  type AgentVerifyRequest,
  type AgentVerifyResultFile,
} from '../verification/agentIpc';
import {
  formatVerifySummary,
  runVerificationHarness,
} from '../verification/harness';

const POLL_MS = 700;

/**
 * Watches `.vscode/orbital-verify-request.json` so agents can run
 * `npm run verify:agent` from the terminal while Cursor is open.
 */
export function registerAgentVerifyTrigger(
  context: vscode.ExtensionContext,
  engine: CelebrationEngine,
): vscode.Disposable {
  const disposables: vscode.Disposable[] = [];
  let lastHandledAt = 0;
  let running = false;

  const writeResult = async (
    folder: vscode.WorkspaceFolder,
    payload: AgentVerifyResultFile,
  ): Promise<void> => {
    const uri = vscode.Uri.joinPath(folder.uri, VERIFY_RESULT_REL);
    const body = Buffer.from(JSON.stringify(payload, null, 2), 'utf8');
    await vscode.workspace.fs.writeFile(uri, body);
  };

  const handleRequest = async (): Promise<void> => {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder || running) {
      return;
    }

    const reqUri = vscode.Uri.joinPath(folder.uri, VERIFY_REQUEST_REL);
    let request: AgentVerifyRequest;
    try {
      const raw = await vscode.workspace.fs.readFile(reqUri);
      request = JSON.parse(Buffer.from(raw).toString('utf8')) as AgentVerifyRequest;
    } catch {
      return;
    }

    const at = typeof request.at === 'number' ? request.at : 0;
    if (!at || at <= lastHandledAt) {
      return;
    }

    running = true;
    lastHandledAt = at;
    orbitalLog('Agent verify request', `at=${at}`);

    try {
      const playVisuals = request.playVisuals !== false;
      const results = await runVerificationHarness(engine, { playVisuals });
      const failed = results.filter((r) => !r.ok).length;
      const version = String(context.extension.packageJSON.version ?? '?');
      const summary = formatVerifySummary(results);
      const payload: AgentVerifyResultFile = {
        at: Date.now(),
        requestAt: at,
        version,
        ok: failed === 0,
        summary,
        results,
      };
      await writeResult(folder, payload);
      orbitalLog('Agent verify result written', `${VERIFY_RESULT_REL} · ${failed === 0 ? 'PASS' : 'FAIL'}`);
    } catch (err) {
      await writeResult(folder, {
        at: Date.now(),
        requestAt: at,
        version: String(context.extension.packageJSON.version ?? '?'),
        ok: false,
        summary: `Agent verify crashed: ${String(err)}`,
        results: [{ id: 'preview', ok: false, detail: String(err) }],
      });
      orbitalLog('Agent verify failed', String(err));
    } finally {
      running = false;
    }
  };

  const watcher = vscode.workspace.createFileSystemWatcher(`**/${VERIFY_REQUEST_REL}`);
  watcher.onDidCreate(() => void handleRequest());
  watcher.onDidChange(() => void handleRequest());
  disposables.push(watcher);

  const poll = setInterval(() => void handleRequest(), POLL_MS);
  disposables.push({ dispose: () => clearInterval(poll) });

  void handleRequest();
  orbitalLog('Agent verify listener active', `${VERIFY_REQUEST_REL} → ${VERIFY_RESULT_REL}`);

  return vscode.Disposable.from(...disposables);
}
