import { useEffect } from "react";
import type { ActiveMod } from "./game/types";
import { LEVELS } from "./game/levels";
import { useGameState } from "./hooks/useGameState";
import { useKeyboard } from "./hooks/useKeyboard";
import { Board } from "./components/Board";
import { HUD } from "./components/HUD";

export default function HedgehogMaze() {
  const state = useGameState();
  const level = LEVELS[state.currentLevel];
  const cellSize = Math.min(Math.floor(520 / level.size), 44);

  useKeyboard({
    grid: state.grid,
    playerPos: state.playerPos,
    frozen: state.frozen,
    swapLR: state.swapLR,
    invertAll: state.invertAll,
    speedX2: state.speedX2,
    gameStarted: state.gameStarted,
    levelComplete: state.levelComplete,
    timer: state.timer,
    currentLevel: state.currentLevel,
    lastMove: state.lastMove,
    skipTransition: state.skipTransition,
    moveDir: state.moveDir,
    setPlayerPos: state.setPlayerPos,
    setMoveCount: state.setMoveCount,
    setIsRunning: state.setIsRunning,
    setGameStarted: state.setGameStarted,
    setLevelComplete: state.setLevelComplete,
    setCompletedTimes: state.setCompletedTimes,
    setGrid: state.setGrid,
    handleSymbol: state.handleSymbol,
    showFlash: state.showFlash,
  });

  useEffect(() => {
    state.gameRef.current?.focus();
  }, [state.currentLevel]);

  const activeMods: ActiveMod[] = [];
  if (state.swapLR) activeMods.push({ label: "Izq ↔ Der", color: "#7F77DD" });
  if (state.invertAll) activeMods.push({ label: "Invertido", color: "#E24B4A" });
  if (state.frozen) activeMods.push({ label: "Congelado", color: "#378ADD" });
  if (state.speedX2) activeMods.push({ label: "Velocidad x2", color: "#D85A30" });

  return (
    <div ref={state.gameRef} tabIndex={0} style={{ outline: "none", maxWidth: 740, margin: "0 auto" }}>
      <HUD
        level={level}
        currentLevel={state.currentLevel}
        totalLevels={LEVELS.length}
        completedTimes={state.completedTimes}
        timer={state.timer}
        moveCount={state.moveCount}
        activeMods={activeMods}
        gameStarted={state.gameStarted}
        levelComplete={state.levelComplete}
        setCurrentLevel={state.setCurrentLevel}
      />
      <Board
        grid={state.grid}
        cellSize={cellSize}
        levelSize={level.size}
        playerPos={state.playerPos}
        visualPos={state.visualPos}
        visited={state.visited}
        shaking={state.shaking}
        squashPhase={state.squashPhase}
        moveDir={state.moveDir.current}
        skipTransition={state.skipTransition.current}
        flash={state.flash}
        levelComplete={state.levelComplete}
        timer={state.timer}
        moveCount={state.moveCount}
        currentLevel={state.currentLevel}
        totalLevels={LEVELS.length}
        loadLevel={state.loadLevel}
        setCurrentLevel={state.setCurrentLevel}
      />
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
