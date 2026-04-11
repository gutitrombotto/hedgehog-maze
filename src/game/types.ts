export interface Position {
  r: number;
  c: number;
}

export interface FlashMessage {
  text: string;
  color: string;
}

export interface ActiveMod {
  label: string;
  color: string;
}

export interface LevelDef {
  name: string;
  subtitle: string;
  size: number;
  grid: number[][];
}

export type SquashPhase = "idle" | "stretch" | "squash";
