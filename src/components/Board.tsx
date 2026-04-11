import type { Position, FlashMessage, SquashPhase } from "../game/types";
import { WALL, STONE, EXIT, START, TELEPORT_A, TELEPORT_B } from "../game/constants";
import { isSymbol, isNearPlayer, formatTime } from "../game/engine";
import { Hedgehog } from "./Hedgehog";
import { SymbolIcon } from "./SymbolIcon";

interface BoardProps {
  grid: number[][];
  cellSize: number;
  levelSize: number;
  playerPos: Position;
  visualPos: { x: number; y: number };
  visited: Set<string>;
  shaking: boolean;
  squashPhase: SquashPhase;
  moveDir: string | null;
  skipTransition: boolean;
  flash: FlashMessage | null;
  levelComplete: boolean;
  timer: number;
  moveCount: number;
  currentLevel: number;
  totalLevels: number;
  loadLevel: (idx: number) => void;
  setCurrentLevel: React.Dispatch<React.SetStateAction<number>>;
}

export function Board({
  grid,
  cellSize,
  levelSize,
  playerPos,
  visualPos,
  visited,
  shaking,
  squashPhase,
  moveDir,
  skipTransition,
  flash,
  levelComplete,
  timer,
  moveCount,
  currentLevel,
  totalLevels,
  loadLevel,
  setCurrentLevel,
}: BoardProps) {
  const boardPixelSize = levelSize * cellSize;

  const getSquashStretch = (): string => {
    const horiz = moveDir === "ArrowLeft" || moveDir === "ArrowRight";
    if (squashPhase === "stretch") return horiz ? "scale(1.15, 0.87)" : "scale(0.87, 1.15)";
    if (squashPhase === "squash") return horiz ? "scale(0.9, 1.1)" : "scale(1.1, 0.9)";
    return "scale(1, 1)";
  };

  return (
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
            gridTemplateColumns: `repeat(${levelSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${levelSize}, ${cellSize}px)`,
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
            transition: skipTransition ? "none" : "transform 120ms ease-out",
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
              {currentLevel < totalLevels - 1 && (
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
  );
}
