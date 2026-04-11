export const EMPTY = 0;
export const WALL = 1;
export const STONE = 2;
export const TELEPORT_A = 3;
export const TELEPORT_B = 33;
export const SWAP_DIR = 4;
export const FREEZE = 5;
export const SPEED_X2 = 6;
export const INVERT_ALL = 7;
export const START = 8;
export const EXIT = 9;
export const HIDDEN_SWAP = 14;
export const HIDDEN_FREEZE = 15;
export const HIDDEN_SPEED = 16;
export const HIDDEN_INVERT = 17;

export const MOVE_COOLDOWN = 150;
export const FREEZE_DURATION = 2500;
export const SPEED_DURATION = 5000;

export const HIDDEN_TYPES = [HIDDEN_SWAP, HIDDEN_FREEZE, HIDDEN_SPEED, HIDDEN_INVERT];
export const SYMBOL_TYPES = [SWAP_DIR, FREEZE, SPEED_X2, INVERT_ALL, ...HIDDEN_TYPES];

// Phaser hex colors (no alpha)
export const COLORS = {
  BG: 0x1a1714,
  TEXT: 0xe8dcc8,
  FLOOR: 0xe8dcc8,
  FLOOR_VISITED: 0xd8d0b0,
  WALL: 0x2a2522,
  STONE: 0x8b7355,
  STONE_LIGHT: 0xa08c6e,
  STONE_DARK: 0x6b5c44,
  BOARD_BG: 0x3d3832,
  BOARD_BORDER: 0x4a433b,
  GRID_LINE: 0xd4c9b5,
  EXIT_GOLD: 0xef9f27,
  EXIT_DARK: 0x412402,
  START_DOT: 0x5dcaa5,
  SWAP: 0x7f77dd,
  FREEZE_COL: 0x378add,
  SPEED: 0xd85a30,
  INVERT: 0xe24b4a,
  TELEPORT: 0x1d9e75,
  HIDDEN: 0x888888,
  MUTED: 0xa09888,
  OVERLAY_BG: 0x000000,
} as const;

// CSS color strings (for Phaser text styles)
export const CSS_COLORS = {
  TEXT: "#e8dcc8",
  MUTED: "#a09888",
  DARK_MUTED: "#6b6258",
  EXIT_GOLD: "#EF9F27",
  EXIT_DARK: "#412402",
  SWAP: "#7F77DD",
  FREEZE: "#378ADD",
  SPEED: "#D85A30",
  INVERT: "#E24B4A",
  TELEPORT: "#1D9E75",
  HIDDEN: "#888888",
  WHITE: "#ffffff",
  LEVEL_BG_ACTIVE: "#e8dcc8",
  LEVEL_TEXT_ACTIVE: "#1a1714",
  LEVEL_BG_INACTIVE: "#2a2522",
  LEVEL_TEXT_INACTIVE: "#a09888",
  LEVEL_BORDER: "#3d3832",
} as const;

export const SCENE_KEYS = {
  BOOT: "BootScene",
  GAME: "GameScene",
  UI: "UIScene",
} as const;

export const FONT_FAMILY = '"JetBrains Mono", "SF Mono", "Fira Code", monospace';

// Layout constants for side-panel design (1100×750 canvas)
export const LAYOUT = {
  CANVAS_W: 1100,
  CANVAS_H: 750,
  BOARD_AREA_W: 720,       // left area for the board
  PANEL_X: 730,             // right panel starts here
  PANEL_W: 350,             // right panel width
  BOARD_MARGIN: 20,         // margin around board within its area
  BOARD_TOP: 20,            // top margin for board
} as const;
