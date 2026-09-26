export type WinKind =
  | 'tests'
  | 'build'
  | 'commit'
  | 'push'
  | 'stash'
  | 'debug'
  | 'save'
  | 'task'
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
