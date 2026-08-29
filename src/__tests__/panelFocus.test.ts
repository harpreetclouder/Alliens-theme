import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTerminal = { show: vi.fn() };

vi.mock('vscode', () => ({
  window: {
    get activeTerminal() {
      return mockTerminal;
    },
  },
}));

describe('capturePanelFocus', () => {
  beforeEach(() => {
    mockTerminal.show.mockClear();
  });

  it('defaults to terminal when an integrated terminal is active', async () => {
    const { capturePanelFocus } = await import('../celebrations/panelFocus');
    const snap = capturePanelFocus();
    expect(snap.returnFocus).toBe('terminal');
    expect(snap.activeTerminal).toBe(mockTerminal);
  });

  it('honours explicit returnFocus none', async () => {
    const { capturePanelFocus } = await import('../celebrations/panelFocus');
    const snap = capturePanelFocus('none');
    expect(snap.returnFocus).toBe('none');
  });
});
