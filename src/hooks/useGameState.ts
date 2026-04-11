import { useState, useEffect, useCallback, useRef } from "react";
import type { Position, FlashMessage, SquashPhase } from "../game/types";
import { START, SWAP_DIR, FREEZE, SPEED_X2, INVERT_ALL, FREEZE_DURATION, SPEED_DURATION } from "../game/constants";
import { findCell, resolveHiddenType, gridPixelPos } from "../game/engine";
import { LEVELS } from "../game/levels";

export function useGameState() {
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
  const [squashPhase, setSquashPhase] = useState<SquashPhase>("idle");
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

  // Timer
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

  return {
    currentLevel,
    setCurrentLevel,
    playerPos,
    setPlayerPos,
    grid,
    setGrid,
    timer,
    isRunning,
    setIsRunning,
    gameStarted,
    setGameStarted,
    levelComplete,
    setLevelComplete,
    completedTimes,
    setCompletedTimes,
    swapLR,
    invertAll,
    frozen,
    speedX2,
    flash,
    moveCount,
    setMoveCount,
    visualPos,
    visited,
    shaking,
    squashPhase,
    lastMove,
    skipTransition,
    moveDir,
    gameRef,
    freezeTimer,
    speedTimer,
    loadLevel,
    handleSymbol,
    showFlash,
  };
}
