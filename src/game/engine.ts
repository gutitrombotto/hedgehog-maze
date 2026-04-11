import type { Position } from "./types";
import {
  WALL,
  STONE,
  HIDDEN_SWAP,
  HIDDEN_FREEZE,
  HIDDEN_SPEED,
  HIDDEN_INVERT,
  SWAP_DIR,
  FREEZE,
  SPEED_X2,
  INVERT_ALL,
  SYMBOL_TYPES,
} from "./constants";

export const findCell = (grid: number[][], type: number): Position | null => {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === type) return { r, c };
    }
  }
  return null;
};

export const isNearPlayer = (pr: number, pc: number, cr: number, cc: number): boolean =>
  Math.abs(pr - cr) <= 2 && Math.abs(pc - cc) <= 2;

export const isSymbol = (cell: number): boolean => SYMBOL_TYPES.includes(cell);
export const isBlocking = (cell: number): boolean => cell === WALL || cell === STONE;

export const resolveHiddenType = (cell: number): number => {
  if (cell === HIDDEN_SWAP) return SWAP_DIR;
  if (cell === HIDDEN_FREEZE) return FREEZE;
  if (cell === HIDDEN_SPEED) return SPEED_X2;
  if (cell === HIDDEN_INVERT) return INVERT_ALL;
  return cell;
};

export const formatTime = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s % 60).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

export const gridPixelPos = (pos: Position, cellSize: number) => ({
  x: pos.c * cellSize,
  y: pos.r * cellSize,
});
