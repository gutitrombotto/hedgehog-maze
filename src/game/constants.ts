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
