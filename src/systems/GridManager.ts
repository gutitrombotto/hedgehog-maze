import Phaser from "phaser";
import type { LevelDef } from "../data/types";
import {
  WALL,
  STONE,
  EXIT,
  START,
  TELEPORT_A,
  TELEPORT_B,
  HIDDEN_TYPES,
  COLORS,
} from "../data/constants";
import { isSymbol, isNearPlayer, resolveHiddenType } from "../utils/engine";

const SYMBOL_TEXTURE_MAP: Record<number, string> = {
  4: "symbol_swap",
  5: "symbol_freeze",
  6: "symbol_speed",
  7: "symbol_invert",
  3: "symbol_teleport",
  33: "symbol_teleport",
};

export class GridManager {
  private scene: Phaser.Scene;
  private floorTiles: Phaser.GameObjects.Rectangle[][] = [];
  private overlays: Map<string, Phaser.GameObjects.GameObject> = new Map();
  private exitSprite: Phaser.GameObjects.Image | null = null;
  private exitTween: Phaser.Tweens.Tween | null = null;
  private boardBorder: Phaser.GameObjects.Graphics | null = null;

  grid: number[][] = [];
  cellSize = 0;
  boardX = 0;
  boardY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  buildGrid(level: LevelDef, offsetX: number, offsetY: number) {
    this.clear();

    this.grid = level.grid.map((row) => [...row]);
    this.cellSize = Math.min(Math.floor(520 / level.size), 44);
    const boardPixelSize = level.size * this.cellSize;
    this.boardX = offsetX;
    this.boardY = offsetY;

    // Board background
    const bg = this.scene.add.rectangle(
      this.boardX + boardPixelSize / 2,
      this.boardY + boardPixelSize / 2,
      boardPixelSize,
      boardPixelSize,
      COLORS.BOARD_BG
    ).setDepth(0);
    this.overlays.set("bg", bg);

    // Border
    this.boardBorder = this.scene.add.graphics().setDepth(10);
    this.boardBorder.lineStyle(2, COLORS.BOARD_BORDER);
    this.boardBorder.strokeRoundedRect(
      this.boardX - 1,
      this.boardY - 1,
      boardPixelSize + 2,
      boardPixelSize + 2,
      8
    );

    // Render cells
    this.floorTiles = [];
    for (let r = 0; r < level.size; r++) {
      this.floorTiles[r] = [];
      for (let c = 0; c < level.size; c++) {
        const cell = this.grid[r][c];
        const x = this.boardX + c * this.cellSize + this.cellSize / 2;
        const y = this.boardY + r * this.cellSize + this.cellSize / 2;

        // Floor tile
        let floorColor: number = COLORS.FLOOR;
        if (cell === WALL) floorColor = COLORS.WALL;

        const tile = this.scene.add.rectangle(x, y, this.cellSize, this.cellSize, floorColor).setDepth(1);
        this.floorTiles[r][c] = tile;

        // Grid lines (only for non-wall)
        if (cell !== WALL) {
          const gridLine = this.scene.add.rectangle(x, y, this.cellSize - 0.5, this.cellSize - 0.5)
            .setStrokeStyle(0.5, COLORS.GRID_LINE)
            .setDepth(1);
          this.overlays.set(`gridline_${r}_${c}`, gridLine);
        }

        // Stone overlay
        if (cell === STONE) {
          const stone = this.scene.add.image(x, y, "cell_stone")
            .setDisplaySize(this.cellSize * 0.7, this.cellSize * 0.7)
            .setDepth(2);
          this.overlays.set(`stone_${r}_${c}`, stone);
        }

        // Exit
        if (cell === EXIT) {
          this.exitSprite = this.scene.add.image(x, y, "cell_exit")
            .setDisplaySize(this.cellSize * 0.7, this.cellSize * 0.7)
            .setDepth(3);
          this.exitTween = this.scene.tweens.add({
            targets: this.exitSprite,
            scaleX: this.exitSprite.scaleX * 1.12,
            scaleY: this.exitSprite.scaleY * 1.12,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }

        // Start dot
        if (cell === START) {
          const dot = this.scene.add.image(x, y, "cell_start_dot")
            .setDisplaySize(this.cellSize * 0.3, this.cellSize * 0.3)
            .setDepth(2);
          this.overlays.set(`start_${r}_${c}`, dot);
        }

        // Symbol icons (swap, freeze, speed, invert, teleport)
        const isTeleport = cell === TELEPORT_A || cell === TELEPORT_B;
        if ((isSymbol(cell) || isTeleport) && !HIDDEN_TYPES.includes(cell)) {
          const resolved = resolveHiddenType(cell);
          const texKey = isTeleport
            ? "symbol_teleport"
            : SYMBOL_TEXTURE_MAP[resolved] || "symbol_teleport";
          const sprite = this.scene.add.image(x, y, texKey)
            .setDisplaySize(this.cellSize * 0.55, this.cellSize * 0.55)
            .setDepth(3);
          this.overlays.set(`symbol_${r}_${c}`, sprite);
        }

        // Hidden symbols (initially invisible)
        if (HIDDEN_TYPES.includes(cell)) {
          const resolved = resolveHiddenType(cell);
          const texKey = SYMBOL_TEXTURE_MAP[resolved] || "symbol_swap";
          const sprite = this.scene.add.image(x, y, texKey)
            .setDisplaySize(this.cellSize * 0.55, this.cellSize * 0.55)
            .setAlpha(0)
            .setDepth(3);
          this.overlays.set(`hidden_${r}_${c}`, sprite);
        }
      }
    }
  }

  markVisited(r: number, c: number) {
    if (this.floorTiles[r] && this.floorTiles[r][c]) {
      const cell = this.grid[r][c];
      if (cell !== WALL && cell !== STONE) {
        this.floorTiles[r][c].setFillStyle(COLORS.FLOOR_VISITED);
      }
    }
  }

  removeSymbol(r: number, c: number) {
    const key = `symbol_${r}_${c}`;
    const hiddenKey = `hidden_${r}_${c}`;
    for (const k of [key, hiddenKey]) {
      const obj = this.overlays.get(k);
      if (obj) {
        obj.destroy();
        this.overlays.delete(k);
      }
    }
  }

  updateHiddenVisibility(playerR: number, playerC: number) {
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        if (HIDDEN_TYPES.includes(this.grid[r][c])) {
          const key = `hidden_${r}_${c}`;
          const sprite = this.overlays.get(key) as Phaser.GameObjects.Image | undefined;
          if (sprite) {
            const near = isNearPlayer(playerR, playerC, r, c);
            sprite.setAlpha(near ? 0.5 : 0);
          }
        }
      }
    }
  }

  cellToWorld(r: number, c: number): { x: number; y: number } {
    return {
      x: this.boardX + c * this.cellSize + this.cellSize / 2,
      y: this.boardY + r * this.cellSize + this.cellSize / 2,
    };
  }

  hideStartDot(r: number, c: number) {
    const key = `start_${r}_${c}`;
    const obj = this.overlays.get(key) as Phaser.GameObjects.Image | undefined;
    if (obj) obj.setVisible(false);
  }

  showStartDot(r: number, c: number) {
    const key = `start_${r}_${c}`;
    const obj = this.overlays.get(key) as Phaser.GameObjects.Image | undefined;
    if (obj) obj.setVisible(true);
  }

  clear() {
    for (const row of this.floorTiles) {
      for (const tile of row) {
        tile.destroy();
      }
    }
    this.floorTiles = [];

    for (const [, obj] of this.overlays) {
      obj.destroy();
    }
    this.overlays.clear();

    if (this.exitSprite) {
      this.exitSprite.destroy();
      this.exitSprite = null;
    }
    if (this.exitTween) {
      this.exitTween.destroy();
      this.exitTween = null;
    }
    if (this.boardBorder) {
      this.boardBorder.destroy();
      this.boardBorder = null;
    }
  }
}
