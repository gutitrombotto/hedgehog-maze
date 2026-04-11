import type { LevelDef, ActiveMod } from "../game/types";
import { formatTime } from "../game/engine";

interface HUDProps {
  level: LevelDef;
  currentLevel: number;
  totalLevels: number;
  completedTimes: Record<number, number>;
  timer: number;
  moveCount: number;
  activeMods: ActiveMod[];
  gameStarted: boolean;
  levelComplete: boolean;
  setCurrentLevel: (level: number) => void;
}

export function HUD({
  level,
  currentLevel,
  totalLevels,
  completedTimes,
  timer,
  moveCount,
  activeMods,
  gameStarted,
  levelComplete,
  setCurrentLevel,
}: HUDProps) {
  return (
    <>
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
        {Array.from({ length: totalLevels }, (_, i) => (
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

      {/* Start hint */}
      {!gameStarted && !levelComplete && (
        <div style={{ textAlign: "center", marginTop: 12, marginBottom: -8, fontSize: 12, color: "#6b6258", animation: "blink 1.5s infinite" }}>
          Presioná una flecha para comenzar
        </div>
      )}
    </>
  );
}
