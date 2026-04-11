import { useCallback, useEffect } from "react";
import type { Position } from "../game/types";
import { MOVE_COOLDOWN, EMPTY, EXIT, TELEPORT_A, TELEPORT_B } from "../game/constants";
import { isBlocking, isSymbol, findCell } from "../game/engine";

interface UseKeyboardParams {
  grid: number[][];
  playerPos: Position;
  frozen: boolean;
  swapLR: boolean;
  invertAll: boolean;
  speedX2: boolean;
  gameStarted: boolean;
  levelComplete: boolean;
  timer: number;
  currentLevel: number;
  lastMove: React.MutableRefObject<number>;
  skipTransition: React.MutableRefObject<boolean>;
  moveDir: React.MutableRefObject<string | null>;
  setPlayerPos: React.Dispatch<React.SetStateAction<Position>>;
  setMoveCount: React.Dispatch<React.SetStateAction<number>>;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setGameStarted: React.Dispatch<React.SetStateAction<boolean>>;
  setLevelComplete: React.Dispatch<React.SetStateAction<boolean>>;
  setCompletedTimes: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  setGrid: React.Dispatch<React.SetStateAction<number[][]>>;
  handleSymbol: (cell: number) => void;
  showFlash: (text: string, color: string) => void;
}

export function useKeyboard(params: UseKeyboardParams) {
  const {
    grid,
    playerPos,
    frozen,
    swapLR,
    invertAll,
    speedX2,
    gameStarted,
    levelComplete,
    timer,
    currentLevel,
    lastMove,
    skipTransition,
    moveDir,
    setPlayerPos,
    setMoveCount,
    setIsRunning,
    setGameStarted,
    setLevelComplete,
    setCompletedTimes,
    setGrid,
    handleSymbol,
    showFlash,
  } = params;

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

      let nr = playerPos.r;
      let nc = playerPos.c;
      if (dir === "ArrowUp") nr--;
      if (dir === "ArrowDown") nr++;
      if (dir === "ArrowLeft") nc--;
      if (dir === "ArrowRight") nc++;

      if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) return;
      if (isBlocking(grid[nr][nc])) return;

      const cell = grid[nr][nc];
      setMoveCount((m) => m + 1);

      if (cell === EXIT) {
        setIsRunning(false);
        setLevelComplete(true);
        setCompletedTimes((prev) => ({ ...prev, [currentLevel]: timer }));
        setPlayerPos({ r: nr, c: nc });
        return;
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
          setPlayerPos(dest);
          return;
        }
      }
      if (cell === TELEPORT_B) {
        const dest = findCell(grid, TELEPORT_A);
        if (dest) {
          skipTransition.current = true;
          showFlash("Teletransporte", "#1D9E75");
          setPlayerPos(dest);
          return;
        }
      }

      setPlayerPos({ r: nr, c: nc });
    },
    [grid, playerPos, frozen, swapLR, invertAll, speedX2, gameStarted, levelComplete, timer, currentLevel, handleSymbol, showFlash, lastMove, skipTransition, moveDir, setPlayerPos, setMoveCount, setIsRunning, setGameStarted, setLevelComplete, setCompletedTimes, setGrid]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
