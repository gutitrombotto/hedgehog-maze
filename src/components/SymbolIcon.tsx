import {
  HIDDEN_TYPES,
  SWAP_DIR,
  FREEZE,
  SPEED_X2,
  INVERT_ALL,
  TELEPORT_A,
  TELEPORT_B,
} from "../game/constants";
import { resolveHiddenType } from "../game/engine";

export const SymbolIcon = ({ type, size, nearPlayer }: { type: number; size: number; nearPlayer: boolean }) => {
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
