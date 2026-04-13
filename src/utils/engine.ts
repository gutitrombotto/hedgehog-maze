import type { Position } from "../data/types";
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
} from "../data/constants";

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

/**
 * BFS shortest path distance between two positions in a grid.
 * Treats any cell satisfying isBlocking() as impassable.
 * Returns the number of steps, or -1 if no path exists.
 */
export const pathDistance = (
  grid: number[][],
  start: Position,
  end: Position,
): number => {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  if (start.r === end.r && start.c === end.c) return 0;

  const visited = new Set<string>();
  const queue: Array<{ r: number; c: number; dist: number }> = [
    { r: start.r, c: start.c, dist: 0 },
  ];
  visited.add(`${start.r},${start.c}`);

  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    const { r, c, dist } = queue.shift()!;
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      if (isBlocking(grid[nr][nc])) continue;
      if (nr === end.r && nc === end.c) return dist + 1;
      visited.add(key);
      queue.push({ r: nr, c: nc, dist: dist + 1 });
    }
  }

  return -1;
};

/**
 * Single-source BFS that returns a distance map from `start` to all reachable cells.
 * Key: "r,c", Value: number of steps from start.
 * Much more efficient than calling pathDistance() per candidate cell.
 */
export const bfsDistanceMap = (
  grid: number[][],
  start: Position,
): Map<string, number> => {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const dist = new Map<string, number>();

  const queue: Array<{ r: number; c: number; d: number }> = [
    { r: start.r, c: start.c, d: 0 },
  ];
  dist.set(`${start.r},${start.c}`, 0);

  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    const { r, c, d } = queue.shift()!;
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const key = `${nr},${nc}`;
      if (dist.has(key)) continue;
      if (isBlocking(grid[nr][nc])) continue;
      dist.set(key, d + 1);
      queue.push({ r: nr, c: nc, d: d + 1 });
    }
  }

  return dist;
};
