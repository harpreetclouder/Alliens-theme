/** Shared paths for agent ↔ extension verification IPC (mirrors test-pass signal). */
export const VERIFY_REQUEST_REL = '.vscode/orbital-verify-request.json';
export const VERIFY_RESULT_REL = '.vscode/orbital-verify-result.json';
export const COMMIT_DETECTED_REL = '.vscode/orbital-commit-detected.json';

export interface AgentVerifyRequest {
  at: number;
  playVisuals?: boolean;
  /** When true (default), fire commit celebration path inside the harness. */
  probeCommit?: boolean;
}

export interface AgentVerifyResultFile {
  at: number;
  requestAt: number;
  version: string;
  ok: boolean;
  summary: string;
  results: Array<{ id: string; ok: boolean; detail: string }>;
}

export interface CommitDetectedFile {
  at: number;
  sha: string;
  source: string;
  version: string;
}
