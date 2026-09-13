export type PackId = 'mothership' | 'glitch' | 'soft' | 'root' | 'acid';

export interface PackDefinition {
  id: PackId;
  label: string;
  themePath: string;
  sfxFile: string;
  /** Hex accent used to tint shared library loops */
  tint: string;
}
