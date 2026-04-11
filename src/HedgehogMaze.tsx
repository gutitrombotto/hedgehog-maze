import { useState, useEffect, useCallback, useRef } from "react";

// --- Types ---
interface Position {
  r: number;
  c: number;
}

interface FlashMessage {
  text: string;
  color: string;
}

interface ActiveMod {
  label: string;
  color: string;
}

interface LevelDef {
  name: string;
  subtitle: string;
  size: number;
  grid: number[][];
}

// --- Constants ---
const EMPTY = 0;
const WALL = 1;
const STONE = 2;
const TELEPORT_A = 3;
const TELEPORT_B = 33;
const SWAP_DIR = 4;
const FREEZE = 5;
const SPEED_X2 = 6;
const INVERT_ALL = 7;
const START = 8;
const EXIT = 9;
const HIDDEN_SWAP = 14;
const HIDDEN_FREEZE = 15;
const HIDDEN_SPEED = 16;
const HIDDEN_INVERT = 17;

const MOVE_COOLDOWN = 150;
const FREEZE_DURATION = 2500;
const SPEED_DURATION = 5000;

const HIDDEN_TYPES = [HIDDEN_SWAP, HIDDEN_FREEZE, HIDDEN_SPEED, HIDDEN_INVERT];
const SYMBOL_TYPES = [SWAP_DIR, FREEZE, SPEED_X2, INVERT_ALL, ...HIDDEN_TYPES];

// --- Level data ---
const LEVELS: LevelDef[] = [
  {
    name: "El despertar",
    subtitle: "Aprende a moverte... y a desconfiar",
    size: 12,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 8, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 4, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 4, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 9, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    name: "Piedra fría",
    subtitle: "Nuevos obstáculos, nuevas reglas",
    size: 14,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 8, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 2, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 2, 1, 1, 0, 1, 0, 1, 1, 4, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 5, 1, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 2, 1, 0, 1, 0, 1, 1, 2, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 4, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 5, 0, 0, 1],
      [1, 0, 1, 1, 1, 2, 0, 1, 1, 1, 1, 1, 9, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    name: "Portal express",
    subtitle: "A veces el camino corto es el largo",
    size: 14,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 8, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 2, 1, 1, 4, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 2, 1, 0, 1, 1, 0, 1, 1, 5, 1, 1, 1],
      [1, 0, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 2, 1, 0, 1, 33, 0, 0, 1, 0, 1],
      [1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 4, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 9, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    name: "Mundo invertido",
    subtitle: "Arriba es abajo, izquierda es derecha",
    size: 16,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 8, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 2, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 4, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 2, 1, 1, 0, 1, 0, 1, 1, 7, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 5, 1, 1, 0, 1, 0, 1, 1, 2, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 2, 1, 0, 1, 0, 1, 1, 2, 0, 1, 0, 1],
      [1, 3, 0, 0, 0, 1, 0, 0, 6, 1, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 0, 1, 1, 4, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 5, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 2, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 33, 0, 1, 0, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 9, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    name: "La madriguera",
    subtitle: "No todo es lo que parece",
    size: 16,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 8, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 14, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 2, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 15, 1, 0, 0, 0, 3, 0, 0, 1, 0, 1],
      [1, 0, 2, 1, 1, 0, 1, 0, 1, 1, 4, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 5, 1, 1, 0, 1, 16, 1, 1, 2, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 2, 1, 0, 1, 0, 1, 1, 2, 0, 1, 0, 1],
      [1, 0, 0, 17, 0, 1, 0, 0, 6, 1, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 0, 1, 1, 14, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 5, 0, 0, 0, 33, 1],
      [1, 0, 1, 1, 1, 2, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 15, 0, 0, 7, 0, 0, 2, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 9, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
];

// --- Helpers ---
const findCell = (grid: number[][], type: number): Position | null => {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === type) return { r, c };
    }
  }
  return null;
};

const isNearPlayer = (pr: number, pc: number, cr: number, cc: number): boolean =>
  Math.abs(pr - cr) <= 2 && Math.abs(pc - cc) <= 2;

const isSymbol = (cell: number): boolean => SYMBOL_TYPES.includes(cell);
const isBlocking = (cell: number): boolean => cell === WALL || cell === STONE;

const resolveHiddenType = (cell: number): number => {
  if (cell === HIDDEN_SWAP) return SWAP_DIR;
  if (cell === HIDDEN_FREEZE) return FREEZE;
  if (cell === HIDDEN_SPEED) return SPEED_X2;
  if (cell === HIDDEN_INVERT) return INVERT_ALL;
  return cell;
};

const formatTime = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s % 60).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

const gridPixelPos = (pos: Position, cellSize: number) => ({
  x: pos.c * cellSize,
  y: pos.r * cellSize,
});

// --- Sub-components ---
const Hedgehog = ({ size }: { size: number }) => (
  <svg viewBox="0 0 100 100" width={size * 0.8} height={size * 0.8}>
    <ellipse cx="50" cy="58" rx="30" ry="26" fill="#8B6914" />
    <ellipse cx="50" cy="62" rx="22" ry="18" fill="#F5DEB3" />
    <polygon points="30,40 22,20 38,35" fill="#5C4A1E" />
    <polygon points="42,32 40,10 52,28" fill="#5C4A1E" />
    <polygon points="54,30 58,8 62,28" fill="#5C4A1E" />
    <polygon points="64,34 72,14 68,36" fill="#5C4A1E" />
    <polygon points="72,42 82,24 74,44" fill="#5C4A1E" />
    <circle cx="40" cy="55" r="4" fill="#1a1a1a" />
    <circle cx="60" cy="55" r="4" fill="#1a1a1a" />
    <circle cx="41.5" cy="53.5" r="1.5" fill="white" />
    <circle cx="61.5" cy="53.5" r="1.5" fill="white" />
    <ellipse cx="50" cy="64" rx="4" ry="3" fill="#D2691E" />
    <path d="M 44 70 Q 50 76 56 70" fill="none" stroke="#6B4226" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SymbolIcon = ({ type, size, nearPlayer }: { type: number; size: number; nearPlayer: boolean }) => {
  const isHidden = HIDDEN_TYPES.includes(type);
  if (isHidden && !nearPlayer) return null;

  const actualType = resolveHiddenType(type);
  const s = size * 0.55;
  const opacity = isHidden && nearPlayer ? 0.5 : 1;

  const configs: Record<number, { bg: string; content: JSX.Element }> = {
    [SWAP_DIR]: {
      bg: "#7F77DD",
      content: (
        <>
          <path d="M25 38 L50 28 L50 48 Z" fill="white" />
          <path d="M75 62 L50 72 L50 52 Z" fill="white" />
        </>
      ),
    },
    [FREEZE]: {
      bg: "#378ADD",
      content: <text x="50" y="62" textAnchor="middle" fontSize="42" fill="white" fontWeight="bold">*</text>,
    },
    [SPEED_X2]: {
      bg: "#D85A30",
      content: <text x="50" y="66" textAnchor="middle" fontSize="36" fill="white" fontWeight="bold">x2</text>,
    },
    [INVERT_ALL]: {
      bg: "#E24B4A",
      content: <text x="50" y="66" textAnchor="middle" fontSize="38" fill="white" fontWeight="bold">!</text>,
    },
    [TELEPORT_A]: {
      bg: "#1D9E75",
      content: <text x="50" y="66" textAnchor="middle" fontSize="36" fill="white" fontWeight="bold">@</text>,
    },
    [TELEPORT_B]: {
      bg: "#1D9E75",
      content: <text x="50" y="66" textAnchor="middle" fontSize="36" fill="white" fontWeight="bold">@</text>,
    },
  };

  const config = configs[actualType] || configs[TELEPORT_A];
  if (!config) return null;

  return (
    <svg viewBox="0 0 100 100" width={s} height={s} style={{ opacity }}>
      <circle cx="50" cy="50" r="45" fill={config.bg} opacity="0.85" />
      {config.content}
    </svg>
  );
};

// --- Main component ---
export default function HedgehogMaze() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [playerPos, setPlayerPos] = useState<Position>({ r: 0, c: 0 });
  const [grid, setGrid] = useState<number[][]>([]);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [completedTimes, setCompletedTimes] = useState<Record<number, number>>({});
  const [swapLR, setSwapLR] = useState(false);
  const [invertAll, setInvertAll] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [speedX2, setSpeedX2] = useState(false);
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [visualPos, setVisualPos] = useState({ x: 0, y: 0 });
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [shaking, setShaking] = useState(false);
  const [squashPhase, setSquashPhase] = useState<"idle" | "stretch" | "squash">("idle");
  const lastMove = useRef(0);
  const freezeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const skipTransition = useRef(false);
  const moveDir = useRef<string | null>(null);

  const loadLevel = useCallback((levelIdx: number) => {
    const level = LEVELS[levelIdx];
    const newGrid = level.grid.map((row) => [...row]);
    const start = findCell(newGrid, START) || { r: 1, c: 1 };
    const cs = Math.min(Math.floor(520 / level.size), 44);
    setGrid(newGrid);
    setPlayerPos(start);
    setTimer(0);
    setIsRunning(false);
    setGameStarted(false);
    setLevelComplete(false);
    setSwapLR(false);
    setInvertAll(false);
    setFrozen(false);
    setSpeedX2(false);
    setFlash(null);
    setMoveCount(0);
    setVisited(new Set());
    setShaking(false);
    setSquashPhase("idle");
    skipTransition.current = true;
    setVisualPos(gridPixelPos(start, cs));
    if (freezeTimer.current) clearTimeout(freezeTimer.current);
    if (speedTimer.current) clearTimeout(speedTimer.current);
  }, []);

  useEffect(() => {
    loadLevel(currentLevel);
  }, [currentLevel, loadLevel]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && !levelComplete) {
      interval = setInterval(() => setTimer((t) => t + 10), 10);
    }
    return () => clearInterval(interval);
  }, [isRunning, levelComplete]);

  // Sync visual position from logical position
  useEffect(() => {
    const cs = Math.min(Math.floor(520 / LEVELS[currentLevel].size), 44);
    setVisualPos(gridPixelPos(playerPos, cs));
    setVisited((prev) => {
      const key = `${playerPos.r},${playerPos.c}`;
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    if (skipTransition.current) {
      setSquashPhase("idle");
      requestAnimationFrame(() => {
        skipTransition.current = false;
      });
    } else {
      setSquashPhase("stretch");
      const t1 = setTimeout(() => setSquashPhase("squash"), 120);
      const t2 = setTimeout(() => setSquashPhase("idle"), 200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [playerPos, currentLevel]);

  const showFlash = (text: string, color: string) => {
    setFlash({ text, color });
    setTimeout(() => setFlash(null), 1500);
  };

  const handleSymbol = useCallback((cell: number) => {
    const type = resolveHiddenType(cell);
    if (type === SWAP_DIR) {
      setSwapLR((v) => !v);
      showFlash("Izquierda ↔ Derecha", "#7F77DD");
    } else if (type === FREEZE) {
      setFrozen(true);
      showFlash("Congelado 2.5s", "#378ADD");
      if (freezeTimer.current) clearTimeout(freezeTimer.current);
      freezeTimer.current = setTimeout(() => setFrozen(false), FREEZE_DURATION);
    } else if (type === SPEED_X2) {
      setSpeedX2(true);
      showFlash("Velocidad x2", "#D85A30");
      if (speedTimer.current) clearTimeout(speedTimer.current);
      speedTimer.current = setTimeout(() => setSpeedX2(false), SPEED_DURATION);
    } else if (type === INVERT_ALL) {
      setInvertAll((v) => !v);
      showFlash("Controles invertidos", "#E24B4A");
    }
    setShaking(true);
    setTimeout(() => setShaking(false), 200);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (levelComplete) return;
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();

      const now = Date.now();
      const cooldown = speedX2 ? MOVE_COOLDOWN / 2 : MOVE_COOLDOWN;
      if (now - lastMove.current < cooldown) return;
      lastMove.current = now;

      if (!gameStarted) {
        setGameStarted(true);
        setIsRunning(true);
      }
      if (frozen) return;

      let dir = e.key;
      if (swapLR) {
        if (dir === "ArrowLeft") dir = "ArrowRight";
        else if (dir === "ArrowRight") dir = "ArrowLeft";
      }
      if (invertAll) {
        if (dir === "ArrowLeft") dir = "ArrowRight";
        else if (dir === "ArrowRight") dir = "ArrowLeft";
        else if (dir === "ArrowUp") dir = "ArrowDown";
        else if (dir === "ArrowDown") dir = "ArrowUp";
      }

      moveDir.current = dir;

      setPlayerPos((pos) => {
        let nr = pos.r;
        let nc = pos.c;
        if (dir === "ArrowUp") nr--;
        if (dir === "ArrowDown") nr++;
        if (dir === "ArrowLeft") nc--;
        if (dir === "ArrowRight") nc++;

        if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) return pos;
        if (isBlocking(grid[nr][nc])) return pos;

        const cell = grid[nr][nc];
        setMoveCount((m) => m + 1);

        if (cell === EXIT) {
          setIsRunning(false);
          setLevelComplete(true);
          setCompletedTimes((prev) => ({ ...prev, [currentLevel]: timer }));
          return { r: nr, c: nc };
        }

        if (isSymbol(cell)) {
          handleSymbol(cell);
          setGrid((g) => {
            const ng = g.map((row) => [...row]);
            ng[nr][nc] = EMPTY;
            return ng;
          });
        }

        if (cell === TELEPORT_A) {
          const dest = findCell(grid, TELEPORT_B);
          if (dest) {
            skipTransition.current = true;
            showFlash("Teletransporte", "#1D9E75");
            return dest;
          }
        }
        if (cell === TELEPORT_B) {
          const dest = findCell(grid, TELEPORT_A);
          if (dest) {
            skipTransition.current = true;
            showFlash("Teletransporte", "#1D9E75");
            return dest;
          }
        }

        return { r: nr, c: nc };
      });
    },
    [grid, frozen, swapLR, invertAll, speedX2, gameStarted, levelComplete, timer, currentLevel, handleSymbol]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    gameRef.current?.focus();
  }, [currentLevel]);

  const level = LEVELS[currentLevel];
  const cellSize = Math.min(Math.floor(520 / level.size), 44);

  const getSquashStretch = (): string => {
    const dir = moveDir.current;
    const horiz = dir === "ArrowLeft" || dir === "ArrowRight";
    if (squashPhase === "stretch") return horiz ? "scale(1.15, 0.87)" : "scale(0.87, 1.15)";
    if (squashPhase === "squash") return horiz ? "scale(0.9, 1.1)" : "scale(1.1, 0.9)";
    return "scale(1, 1)";
  };

  const boardPixelSize = level.size * cellSize;

  const activeMods: ActiveMod[] = [];
  if (swapLR) activeMods.push({ label: "Izq ↔ Der", color: "#7F77DD" });
  if (invertAll) activeMods.push({ label: "Invertido", color: "#E24B4A" });
  if (frozen) activeMods.push({ label: "Congelado", color: "#378ADD" });
  if (speedX2) activeMods.push({ label: "Velocidad x2", color: "#D85A30" });

  return (
    <div ref={gameRef} tabIndex={0} style={{ outline: "none", maxWidth: 740, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.5px" }}>
          Hedgehog Maze
        </h1>
        <p style={{ fontSize: 12, color: "#a09888", margin: 0 }}>
          Usá las flechas del teclado para mover al erizo hasta la salida
        </p>
      </div>

      {/* Level selector */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {LEVELS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentLevel(i)}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: currentLevel === i ? 700 : 400,
              background: currentLevel === i ? "#e8dcc8" : "#2a2522",
              color: currentLevel === i ? "#1a1714" : "#a09888",
              border: "1px solid #3d3832",
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
          >
            Nivel {i + 1}
            {completedTimes[i] !== undefined && (
              <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
                {formatTime(completedTimes[i])}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Level info */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{level.name}</div>
        <div style={{ fontSize: 12, color: "#a09888" }}>{level.subtitle}</div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 12, fontSize: 13 }}>
        <div>
          <span style={{ color: "#a09888" }}>Tiempo </span>
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatTime(timer)}</span>
        </div>
        <div>
          <span style={{ color: "#a09888" }}>Movimientos </span>
          <span style={{ fontWeight: 600 }}>{moveCount}</span>
        </div>
      </div>

      {/* Active modifiers */}
      {activeMods.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {activeMods.map((mod, i) => (
            <span
              key={i}
              style={{
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 600,
                background: mod.color + "22",
                color: mod.color,
                borderRadius: 20,
                border: `1px solid ${mod.color}44`,
              }}
            >
              {mod.label}
            </span>
          ))}
        </div>
      )}

      {/* Game board */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            position: "relative",
            width: boardPixelSize + 4,
            height: boardPixelSize + 4,
            animation: shaking ? "shake 200ms ease-in-out" : "none",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${level.size}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${level.size}, ${cellSize}px)`,
              border: "2px solid #4a433b",
              borderRadius: 8,
              overflow: "hidden",
              background: "#3d3832",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isExit = cell === EXIT;
                const isStart = cell === START;
                const isTeleport = cell === TELEPORT_A || cell === TELEPORT_B;
                const showSymbol = isSymbol(cell) || isTeleport;
                const near = isNearPlayer(playerPos.r, playerPos.c, r, c);
                const isVisited = visited.has(`${r},${c}`);

                let bg = "#e8dcc8";
                if (cell === WALL) bg = "#2a2522";
                else if (cell === STONE) bg = "#8B7355";
                else if (isVisited) bg = "#d8d0b0";

                return (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      borderRight: cell !== WALL ? "0.5px solid #d4c9b5" : "none",
                      borderBottom: cell !== WALL ? "0.5px solid #d4c9b5" : "none",
                    }}
                  >
                    {cell === STONE && (
                      <div
                        style={{
                          width: cellSize * 0.7,
                          height: cellSize * 0.7,
                          borderRadius: "40%",
                          background: "radial-gradient(circle at 35% 35%, #a08c6e, #6b5c44)",
                          boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.3)",
                        }}
                      />
                    )}
                    {isExit && (
                      <div
                        style={{
                          width: cellSize * 0.7,
                          height: cellSize * 0.7,
                          borderRadius: "50%",
                          background: "#EF9F27",
                          boxShadow: "0 0 12px #EF9F2788",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          animation: "pulse 2s infinite",
                        }}
                      >
                        <span style={{ fontSize: cellSize * 0.35, fontWeight: 700, color: "#412402" }}>S</span>
                      </div>
                    )}
                    {showSymbol && (
                      <SymbolIcon type={cell} size={cellSize} nearPlayer={near} />
                    )}
                    {isStart && !(playerPos.r === r && playerPos.c === c) && (
                      <div
                        style={{
                          width: cellSize * 0.3,
                          height: cellSize * 0.3,
                          borderRadius: "50%",
                          background: "#5DCAA5",
                          opacity: 0.4,
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Hedgehog overlay */}
          <div
            style={{
              position: "absolute",
              top: 2,
              left: 2,
              width: cellSize,
              height: cellSize,
              transform: `translate(${visualPos.x}px, ${visualPos.y}px)`,
              transition: skipTransition.current ? "none" : "transform 120ms ease-out",
              zIndex: 5,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ transform: getSquashStretch(), transition: "transform 80ms ease-out" }}>
              <Hedgehog size={cellSize} />
            </div>
          </div>

          {/* Flash message */}
          {flash && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: flash.color + "dd",
                color: "white",
                padding: "10px 24px",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                pointerEvents: "none",
                animation: "fadeUp 1.5s forwards",
                zIndex: 10,
                whiteSpace: "nowrap",
              }}
            >
              {flash.text}
            </div>
          )}

          {/* Level complete overlay */}
          {levelComplete && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.7)",
                borderRadius: 8,
                zIndex: 20,
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, color: "#EF9F27", marginBottom: 4 }}>
                Nivel completado
              </div>
              <div style={{ fontSize: 20, color: "white", marginBottom: 4 }}>
                {formatTime(timer)}
              </div>
              <div style={{ fontSize: 14, color: "#ccc", marginBottom: 16 }}>
                {moveCount} movimientos
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => loadLevel(currentLevel)}
                  style={{
                    padding: "8px 20px",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "transparent",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Reintentar
                </button>
                {currentLevel < LEVELS.length - 1 && (
                  <button
                    onClick={() => setCurrentLevel((l) => l + 1)}
                    style={{
                      padding: "8px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      background: "#EF9F27",
                      color: "#412402",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Siguiente nivel →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start hint */}
      {!gameStarted && !levelComplete && (
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#6b6258", animation: "blink 1.5s infinite" }}>
          Presioná una flecha para comenzar
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        {[
          { icon: "▓", label: "Muro", color: "#2a2522", bg: "#2a252266" },
          { icon: "●", label: "Piedra", color: "#8B7355", bg: "#8B735533" },
          { icon: "@", label: "Puente", color: "#1D9E75", bg: "#1D9E7533" },
          { icon: "↔", label: "Swap", color: "#7F77DD", bg: "#7F77DD33" },
          { icon: "✱", label: "Freeze", color: "#378ADD", bg: "#378ADD33" },
          { icon: "x2", label: "Speed", color: "#D85A30", bg: "#D85A3033" },
          { icon: "!", label: "Invertir", color: "#E24B4A", bg: "#E24B4A33" },
          { icon: "?", label: "Oculto", color: "#888", bg: "#88888833" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#a09888" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: item.bg,
                color: item.color,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {item.icon}
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
