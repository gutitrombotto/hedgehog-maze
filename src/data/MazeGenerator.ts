/**
 * MazeGenerator.ts
 *
 * Procedural maze generator for Hedgehog Maze using a Recursive Backtracker
 * (depth-first search / randomized DFS). All randomness is driven by a
 * Mulberry32 seeded PRNG so that a given (tier, seed) pair always produces
 * the same level.
 */

import type { LevelDef, Position } from "./types";
import {
  EMPTY,
  WALL,
  STONE,
  TELEPORT_A,
  TELEPORT_B,
  SWAP_DIR,
  FREEZE,
  SPEED_X2,
  INVERT_ALL,
  START,
  EXIT,
  HIDDEN_SWAP,
  HIDDEN_FREEZE,
  HIDDEN_SPEED,
  HIDDEN_INVERT,
} from "./constants";
import { isBlocking, bfsDistanceMap } from "../utils/engine";

// ---------------------------------------------------------------------------
// Mulberry32 seeded PRNG
// ---------------------------------------------------------------------------

/** Convert any string to a 32-bit seed value. */
function hashString(s: string): number {
  let h = 0x9e3779b9;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  return h >>> 0;
}

/** Returns a function that generates pseudo-random floats in [0, 1). */
function makePRNG(seed: string): () => number {
  let state = hashString(seed);
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let z = Math.imul(state ^ (state >>> 15), 1 | state);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Fisher-Yates in-place shuffle using the given rng. */
function shuffle<T>(rng: () => number, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Tier configuration
// ---------------------------------------------------------------------------

interface TierConfig {
  /** Must be an odd number >= 11. */
  gridSize: number;
  /** Human-readable level name. */
  name: string;
  subtitle: string;
  /** Whether to add STONE obstacles (replaces some WALL cells adjacent to paths). */
  useStones: boolean;
  /** Whether to place TELEPORT_A/B pairs. */
  useTeleports: boolean;
  /** Symbols allowed to appear on the solution path. */
  pathSymbols: number[];
  /** Symbols allowed to appear in dead-ends. */
  deadEndSymbols: number[];
  /** How many path symbols to place (max). */
  pathSymbolCount: number;
  /** How many dead-end symbols to place (max). */
  deadEndSymbolCount: number;
}

export const TOTAL_LEVELS = 5;

const TIER_CONFIGS: TierConfig[] = [
  {
    // Tier 1 – "El despertar"
    gridSize: 11,
    name: "El despertar",
    subtitle: "Aprende a moverte... y a desconfiar",
    useStones: false,
    useTeleports: false,
    pathSymbols: [SWAP_DIR],
    deadEndSymbols: [],
    pathSymbolCount: 2,
    deadEndSymbolCount: 0,
  },
  {
    // Tier 2 – "Piedra fría"
    gridSize: 13,
    name: "Piedra fría",
    subtitle: "Nuevos obstáculos, nuevas reglas",
    useStones: true,
    useTeleports: false,
    pathSymbols: [SWAP_DIR, FREEZE],
    deadEndSymbols: [FREEZE],
    pathSymbolCount: 3,
    deadEndSymbolCount: 1,
  },
  {
    // Tier 3 – "Portal express"
    gridSize: 15,
    name: "Portal express",
    subtitle: "A veces el camino corto es el largo",
    useStones: true,
    useTeleports: true,
    pathSymbols: [SWAP_DIR, SPEED_X2],
    deadEndSymbols: [FREEZE],
    pathSymbolCount: 3,
    deadEndSymbolCount: 2,
  },
  {
    // Tier 4 – "Mundo invertido"
    gridSize: 19,
    name: "Mundo invertido",
    subtitle: "Arriba es abajo, izquierda es derecha",
    useStones: true,
    useTeleports: true,
    pathSymbols: [SWAP_DIR, SPEED_X2, INVERT_ALL],
    deadEndSymbols: [FREEZE, INVERT_ALL],
    pathSymbolCount: 4,
    deadEndSymbolCount: 3,
  },
  {
    // Tier 5 – "La madriguera"
    gridSize: 23,
    name: "La madriguera",
    subtitle: "No todo es lo que parece",
    useStones: true,
    useTeleports: true,
    pathSymbols: [SWAP_DIR, SPEED_X2, INVERT_ALL],
    deadEndSymbols: [HIDDEN_SWAP, HIDDEN_FREEZE, HIDDEN_SPEED, HIDDEN_INVERT],
    pathSymbolCount: 5,
    deadEndSymbolCount: 4,
  },
];

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

function createGrid(rows: number, cols: number, fill: number): number[][] {
  return Array.from({ length: rows }, () => new Array(cols).fill(fill));
}

/** Manhattan distance between two positions. */
function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

/**
 * Returns all four cardinal-direction neighbours (no diagonal).
 * Filters out-of-bounds automatically.
 */
function cardinalNeighbours(r: number, c: number, rows: number, cols: number): Position[] {
  return [
    { r: r - 1, c },
    { r: r + 1, c },
    { r, c: c - 1 },
    { r, c: c + 1 },
  ].filter((p) => p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols);
}

// ---------------------------------------------------------------------------
// Recursive Backtracker maze carver
// ---------------------------------------------------------------------------

/**
 * Carves a perfect maze into `grid` (all WALL start) using a randomized DFS.
 * Only works on interior odd-indexed cells to maintain wall-cell structure.
 */
function carveMaze(
  grid: number[][],
  rng: () => number,
  startR: number,
  startC: number,
): void {
  const rows = grid.length;
  const cols = grid[0].length;

  grid[startR][startC] = EMPTY;

  // Each "cell" in the maze grid sits at odd (r, c) positions.
  // Neighbours are 2 steps away; the cell between them is the wall to carve.
  const directions = shuffle(rng, [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ]);

  for (const [dr, dc] of directions) {
    const nr = startR + dr;
    const nc = startC + dc;

    if (nr <= 0 || nr >= rows - 1 || nc <= 0 || nc >= cols - 1) continue;
    if (grid[nr][nc] !== WALL) continue;

    // Carve the wall between current and neighbour
    grid[startR + dr / 2][startC + dc / 2] = EMPTY;
    carveMaze(grid, rng, nr, nc);
  }
}

// ---------------------------------------------------------------------------
// BFS path reconstruction (returns the full cell sequence)
// ---------------------------------------------------------------------------

function bfsPath(grid: number[][], start: Position, end: Position): Position[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const visited = new Map<string, string | null>();
  const key = (p: Position) => `${p.r},${p.c}`;

  const queue: Position[] = [start];
  visited.set(key(start), null);

  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.r === end.r && cur.c === end.c) {
      // Reconstruct path
      const path: Position[] = [];
      let k: string | null = key(end);
      while (k !== null) {
        const [r, c] = k.split(",").map(Number);
        path.unshift({ r, c });
        k = visited.get(k) ?? null;
      }
      return path;
    }
    for (const [dr, dc] of dirs) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nk = `${nr},${nc}`;
      if (visited.has(nk)) continue;
      if (isBlocking(grid[nr][nc])) continue;
      visited.set(nk, key(cur));
      queue.push({ r: nr, c: nc });
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Dead-end detection
// ---------------------------------------------------------------------------

/** A cell is a dead-end if exactly one of its 4 cardinal neighbours is passable. */
function findDeadEnds(grid: number[][], excludeSet: Set<string>): Position[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const deadEnds: Position[] = [];

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (isBlocking(grid[r][c])) continue;
      if (grid[r][c] !== EMPTY) continue; // skip already-placed items
      if (excludeSet.has(`${r},${c}`)) continue;

      const passable = cardinalNeighbours(r, c, rows, cols).filter(
        (n) => !isBlocking(grid[n.r][n.c]),
      ).length;

      if (passable === 1) {
        deadEnds.push({ r, c });
      }
    }
  }
  return deadEnds;
}

// ---------------------------------------------------------------------------
// EXIT placement ("tease" mechanic)
// ---------------------------------------------------------------------------

function placeExit(
  grid: number[][],
  start: Position,
  rng: () => number,
): Position {
  const rows = grid.length;
  const cols = grid[0].length;
  const gridArea = rows * cols;

  // Single BFS from start — gives distances to ALL reachable cells at once
  const distMap = bfsDistanceMap(grid, start);

  interface CandInfo {
    pos: Position;
    manhattan: number;
    pathDist: number;
  }

  const candidates: CandInfo[] = [];
  let bestFallback: CandInfo | null = null;

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c] !== EMPTY) continue;
      if (r === start.r && c === start.c) continue;

      const pathDist = distMap.get(`${r},${c}`);
      if (pathDist === undefined) continue; // unreachable

      const pos = { r, c };
      const manhattan = manhattanDistance(start, pos);
      const info: CandInfo = { pos, manhattan, pathDist };

      // Track absolute best as fallback
      if (!bestFallback || pathDist > bestFallback.pathDist) {
        bestFallback = info;
      }

      // "Tease" score: far in path but close in Manhattan
      if (manhattan <= 5 && pathDist >= gridArea * 0.3) {
        candidates.push(info);
      }
    }
  }

  const pool = candidates.length > 0 ? candidates : bestFallback ? [bestFallback] : null;
  if (!pool) {
    // Absolute last resort: bottom-right corner area
    return { r: rows - 2, c: cols - 2 };
  }

  // Among the pool, pick highest pathDist, with ties broken randomly
  const maxDist = Math.max(...pool.map((c) => c.pathDist));
  const top = pool.filter((c) => c.pathDist >= maxDist * 0.9);
  return top[Math.floor(rng() * top.length)].pos;
}

// ---------------------------------------------------------------------------
// Stone placement (optional)
// ---------------------------------------------------------------------------

/**
 * Converts some WALL cells that are adjacent to exactly 2+ empty cells to STONE.
 * This gives visual variety without changing the passable topology.
 */
function placeStones(
  grid: number[][],
  rng: () => number,
  count: number,
): void {
  const rows = grid.length;
  const cols = grid[0].length;

  const candidates: Position[] = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c] !== WALL) continue;
      const adj = cardinalNeighbours(r, c, rows, cols).filter(
        (n) => grid[n.r][n.c] === EMPTY,
      ).length;
      if (adj >= 2) candidates.push({ r, c });
    }
  }

  shuffle(rng, candidates);
  for (let i = 0; i < Math.min(count, candidates.length); i++) {
    const { r, c } = candidates[i];
    grid[r][c] = STONE;
  }
}

// ---------------------------------------------------------------------------
// Teleport placement
// ---------------------------------------------------------------------------

function placeTeleports(
  grid: number[][],
  rng: () => number,
  excludeSet: Set<string>,
): void {
  const rows = grid.length;
  const cols = grid[0].length;
  const midR = Math.floor(rows / 2);
  const midC = Math.floor(cols / 2);

  // Collect empty cells per quadrant
  const quadrants: Position[][] = [[], [], [], []];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c] !== EMPTY) continue;
      if (excludeSet.has(`${r},${c}`)) continue;
      const q = (r < midR ? 0 : 2) + (c < midC ? 0 : 1);
      quadrants[q].push({ r, c });
    }
  }

  // Choose two different quadrants for the pair
  const filledQuads = quadrants
    .map((q, i) => (q.length > 0 ? i : -1))
    .filter((i) => i >= 0);

  if (filledQuads.length < 2) return;

  shuffle(rng, filledQuads);
  const qa = filledQuads[0];
  const qb = filledQuads.find((q) => q !== qa)!;

  if (qb === undefined) return;

  shuffle(rng, quadrants[qa]);
  shuffle(rng, quadrants[qb]);

  const posA = quadrants[qa][0];
  const posB = quadrants[qb][0];

  grid[posA.r][posA.c] = TELEPORT_A;
  grid[posB.r][posB.c] = TELEPORT_B;
  excludeSet.add(`${posA.r},${posA.c}`);
  excludeSet.add(`${posB.r},${posB.c}`);
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Generates a LevelDef for the given tier (1–5) and seed string.
 * The same (tier, seed) will always produce an identical level.
 */
export function generateTier(tier: number, seed: string): LevelDef {
  const clampedTier = Math.max(1, Math.min(5, tier));
  const config = TIER_CONFIGS[clampedTier - 1];
  const rng = makePRNG(`${tier}:${seed}`);

  const size = config.gridSize;
  // Ensure odd grid size for the backtracker
  const gridSize = size % 2 === 0 ? size + 1 : size;

  // --- 1. Initialise grid as all WALLs ---
  const grid = createGrid(gridSize, gridSize, WALL);

  // --- 2. Carve paths with Recursive Backtracker ---
  // Start carving from (1,1) — the top-left interior cell
  carveMaze(grid, rng, 1, 1);

  // --- 3. Place START ---
  const start: Position = { r: 1, c: 1 };
  grid[start.r][start.c] = START;

  // --- 4. Place EXIT using tease mechanic ---
  // Temporarily mark start as EMPTY so pathDistance works
  grid[start.r][start.c] = EMPTY;
  const exit = placeExit(grid, start, rng);
  grid[start.r][start.c] = START;
  grid[exit.r][exit.c] = EXIT;

  // --- 5. Stones (visual variety) ---
  if (config.useStones) {
    const stoneCount = Math.floor(gridSize * 0.8);
    placeStones(grid, rng, stoneCount);
  }

  // --- 6. Compute solution path for symbol placement ---
  // Temporarily restore start as EMPTY for BFS
  grid[start.r][start.c] = EMPTY;
  grid[exit.r][exit.c] = EMPTY;
  const solutionPath = bfsPath(grid, start, exit);
  grid[start.r][start.c] = START;
  grid[exit.r][exit.c] = EXIT;

  // Build a set of occupied positions
  const occupied = new Set<string>([
    `${start.r},${start.c}`,
    `${exit.r},${exit.c}`,
  ]);

  // --- 7. Place path symbols on solution path ---
  // Skip the first and last cells (start/exit)
  const pathCells = solutionPath.slice(1, -1).filter(
    (p) => grid[p.r][p.c] === EMPTY && !occupied.has(`${p.r},${p.c}`),
  );
  shuffle(rng, pathCells);

  const pathSymbolPool = [...config.pathSymbols];
  const numPathSymbols = Math.min(config.pathSymbolCount, pathCells.length);
  for (let i = 0; i < numPathSymbols; i++) {
    const pos = pathCells[i];
    const sym = pathSymbolPool[i % pathSymbolPool.length];
    grid[pos.r][pos.c] = sym;
    occupied.add(`${pos.r},${pos.c}`);
  }

  // --- 8. Place dead-end symbols ---
  if (config.deadEndSymbols.length > 0) {
    const deadEnds = findDeadEnds(grid, occupied);
    shuffle(rng, deadEnds);
    const numDeadEnd = Math.min(config.deadEndSymbolCount, deadEnds.length);
    for (let i = 0; i < numDeadEnd; i++) {
      const pos = deadEnds[i];
      const sym = config.deadEndSymbols[i % config.deadEndSymbols.length];
      grid[pos.r][pos.c] = sym;
      occupied.add(`${pos.r},${pos.c}`);
    }
  }

  // --- 9. Teleport pairs ---
  if (config.useTeleports) {
    placeTeleports(grid, rng, occupied);
  }

  return {
    name: config.name,
    subtitle: config.subtitle,
    size: gridSize,
    grid,
  };
}

/**
 * Generates a random 6-character alphanumeric seed.
 */
export function randomSeed(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}
