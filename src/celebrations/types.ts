export type WinKind = 'tests' | 'build' | 'commit' | 'debug' | 'save' | 'preview';
export type WinSize = 'small' | 'big';

export interface WinEvent {
  kind: WinKind;
  size: WinSize;
  at?: number;
}
