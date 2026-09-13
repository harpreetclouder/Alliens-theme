export type WinKind =
  | 'tests'
  | 'build'
  | 'commit'
  | 'debug'
  | 'save'
  | 'preview'
  | 'checkin'
  | 'pack'
  | 'levelup'
  | 'achievement'
  | 'mission';
export type WinSize = 'small' | 'big';

export interface WinEvent {
  kind: WinKind;
  size: WinSize;
  at?: number;
}
