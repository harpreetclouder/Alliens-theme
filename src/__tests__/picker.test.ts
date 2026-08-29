import { describe, it, expect } from 'vitest';
import { pickLoop } from '../celebrations/picker';

describe('pickLoop', () => {
  it('biases to pack loop when random < 0.6', () => {
    const loop = pickLoop('root', () => 0.1);
    expect(loop.kind).toBe('pack');
    expect(loop.pack).toBe('root');
  });

  it('picks library when random >= 0.6', () => {
    const loop = pickLoop('root', () => 0.9);
    expect(loop.kind).toBe('library');
  });
});
