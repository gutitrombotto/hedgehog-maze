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
  LAYOUT,
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
  exitSprite: Phaser.GameObjects.Image | null = null;
  private exitRing: Phaser.GameObjects.Image | null = null;
  private exitTween: Phaser.Tweens.Tween | null = null;
  private exitRingTween: Phaser.Tweens.Tween | null = null;
  private boardBorder: Phaser.GameObjects.Graphics | null = null;
  private vignette: Phaser.GameObjects.Graphics | null = null;

  grid: number[][] = [];
  cellSize = 0;
  boardX = 0;
  boardY = 0;
  boardPixelSize = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  buildGrid(level: LevelDef, offsetX: number, offsetY: number) {
    this.clear();

    this.grid = level.grid.map((row) => [...row]);
    // Target 36-40px cells; board area allows up to ~680px
    const maxBoardPx = LAYOUT.BOARD_AREA_W - LAYOUT.BOARD_MARGIN * 2;
    this.cellSize = Math.min(Math.floor(maxBoardPx / level.size), 44);
    this.boardPixelSize = level.size * this.cellSize;
    this.boardX = offsetX;
    this.boardY = offsetY;

    // Board shadow (drop shadow behind board)
    const shadowG = this.scene.add.graphics().setDepth(0);
    shadowG.fillStyle(0x000000, 0.35);
    shadowG.fillRoundedRect(
      this.boardX + 4,
      this.boardY + 4,
      this.boardPixelSize + 2,
      this.boardPixelSize + 2,
      12
    );
    this.overlays.set("board_shadow", shadowG);

    // Board background
    const bg = this.scene.add.rectangle(
      this.boardX + this.boardPixelSize / 2,
      this.boardY + this.boardPixelSize / 2,
      this.boardPixelSize,
      this.boardPixelSize,
      COLORS.BOARD_BG
    ).setDepth(0);
    this.overlays.set("bg", bg);

    // Double-border frame with rounded corners
    this.boardBorder = this.scene.add.graphics().setDepth(10);
    // Outer border
    this.boardBorder.lineStyle(3, COLORS.BOARD_BORDER, 0.8);
    this.boardBorder.strokeRoundedRect(
      this.boardX - 3,
      this.boardY - 3,
      this.boardPixelSize + 6,
      this.boardPixelSize + 6,
      10
    );
    // Inner border
    this.boardBorder.lineStyle(1, COLORS.BOARD_BORDER, 0.4);
    this.boardBorder.strokeRoundedRect(
      this.boardX - 0.5,
      this.boardY - 0.5,
      this.boardPixelSize + 1,
      this.boardPixelSize + 1,
      6
    );

    // Render cells
    this.floorTiles = [];
    for (let r = 0; r < level.size; r++) {
      this.floorTiles[r] = [];
      for (let c = 0; c < level.size; c++) {
        const cell = this.grid[r][c];
        const x = this.boardX + c * this.cellSize + this.cellSize / 2;
        const y = this.boardY + r * this.cellSize + this.cellSize / 2;

        // Floor tile with subtle random tint variation for non-walls
        let floorColor: number = COLORS.FLOOR;
        if (cell === WALL) {
          floorColor = COLORS.WALL;
        } else {
          // Subtle per-cell tint variation ±5%
          const variation = 0.95 + Math.random() * 0.1;
          const baseR = (COLORS.FLOOR >> 16) & 0xff;
          const baseG = (COLORS.FLOOR >> 8) & 0xff;
          const baseB = COLORS.FLOOR & 0xff;
          const vr = Math.min(255, Math.round(baseR * variation));
          const vg = Math.min(255, Math.round(baseG * variation));
          const vb = Math.min(255, Math.round(baseB * variation));
          floorColor = (vr << 16) | (vg << 8) | vb;
        }

        const tile = this.scene.add.rectangle(x, y, this.cellSize, this.cellSize, floorColor).setDepth(1);
        this.floorTiles[r][c] = tile;

        // Wall bevel effect (darker edges, lighter center)
        if (cell === WALL) {
          const bevelG = this.scene.add.graphics().setDepth(1);
          // Dark edges
          bevelG.fillStyle(0x1e1b18, 0.5);
          bevelG.fillRect(x - this.cellSize / 2, y - this.cellSize / 2, this.cellSize, 1.5);
          bevelG.fillRect(x - this.cellSize / 2, y - this.cellSize / 2, 1.5, this.cellSize);
          // Lighter center highlight
          bevelG.fillStyle(0x3a3430, 0.4);
          bevelG.fillRect(
            x - this.cellSize / 2 + 2,
            y - this.cellSize / 2 + 2,
            this.cellSize - 4,
            this.cellSize - 4
          );
          // Bottom/right edge (darker)
          bevelG.fillStyle(0x151210, 0.4);
          bevelG.fillRect(x - this.cellSize / 2, y + this.cellSize / 2 - 1.5, this.cellSize, 1.5);
          bevelG.fillRect(x + this.cellSize / 2 - 1.5, y - this.cellSize / 2, 1.5, this.cellSize);
          this.overlays.set(`wallbevel_${r}_${c}`, bevelG);
        }

        // Subtle grid lines for non-wall cells (very low alpha)
        if (cell !== WALL) {
          const gridLine = this.scene.add.rectangle(x, y, this.cellSize - 0.5, this.cellSize - 0.5)
            .setStrokeStyle(0.5, COLORS.GRID_LINE, 0.15)
            .setDepth(1);
          this.overlays.set(`gridline_${r}_${c}`, gridLine);
        }

        // Stone overlay with drop shadow
        if (cell === STONE) {
          // Shadow under stone
          const shadowCircle = this.scene.add.graphics().setDepth(1);
          shadowCircle.fillStyle(0x000000, 0.2);
          shadowCircle.fillEllipse(x + 2, y + 3, this.cellSize * 0.6, this.cellSize * 0.35);
          this.overlays.set(`stoneshadow_${r}_${c}`, shadowCircle);

          const stone = this.scene.add.image(x, y, "cell_stone")
            .setDisplaySize(this.cellSize * 0.7, this.cellSize * 0.7)
            .setDepth(2);
          this.overlays.set(`stone_${r}_${c}`, stone);
        }

        // Exit
        if (cell === EXIT) {
          // Exit ring (rotating halo)
          this.exitRing = this.scene.add.image(x, y, "exit_ring")
            .setDisplaySize(this.cellSize * 0.85, this.cellSize * 0.85)
            .setDepth(2).setAlpha(0.7);
          this.exitRingTween = this.scene.tweens.add({
            targets: this.exitRing,
            angle: 360,
            duration: 4000,
            repeat: -1,
            ease: "Linear",
          });

          this.exitSprite = this.scene.add.image(x, y, "cell_exit")
            .setDisplaySize(this.cellSize * 0.7, this.cellSize * 0.7)
            .setDepth(3);

          // Glow FX on exit (golden glow pulse)
          try {
            const glowFx = this.exitSprite.preFX?.addGlow(0xef9f27, 4, 0, false, 0.1, 10);
            if (glowFx) {
              this.scene.tweens.add({
                targets: glowFx,
                outerStrength: 8,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
              });
            }
          } catch (_e) {
            // preFX may not be available in all renderers
          }

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
            .setDisplaySize(this.cellSize * 0.35, this.cellSize * 0.35)
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

    // Vignette overlay for atmosphere (subtle darkening at edges of board)
    this.vignette = this.scene.add.graphics().setDepth(9);
    const bpx = this.boardPixelSize;
    const vigAlpha = 0.12;
    // Top edge
    this.vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, vigAlpha, vigAlpha, 0, 0);
    this.vignette.fillRect(this.boardX, this.boardY, bpx, bpx * 0.08);
    // Bottom edge
    this.vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, vigAlpha, vigAlpha);
    this.vignette.fillRect(this.boardX, this.boardY + bpx * 0.92, bpx, bpx * 0.08);
    // Left edge
    this.vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, vigAlpha, 0, 0, vigAlpha);
    this.vignette.fillRect(this.boardX, this.boardY, bpx * 0.06, bpx);
    // Right edge
    this.vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, vigAlpha, vigAlpha, 0);
    this.vignette.fillRect(this.boardX + bpx * 0.94, this.boardY, bpx * 0.06, bpx);
  }

  markVisited(r: number, c: number) {
    if (this.floorTiles[r] && this.floorTiles[r][c]) {
      const cell = this.grid[r][c];
      if (cell !== WALL && cell !== STONE) {
        // More visible visited trail - slightly darker + tinted
        this.floorTiles[r][c].setFillStyle(COLORS.FLOOR_VISITED);
        // Add a subtle dot to mark visited path
        const existKey = `visited_${r}_${c}`;
        if (!this.overlays.has(existKey)) {
          const pos = this.cellToWorld(r, c);
          const dot = this.scene.add.graphics().setDepth(1);
          dot.fillStyle(COLORS.FLOOR_VISITED, 0.5);
          dot.fillCircle(pos.x, pos.y, this.cellSize * 0.08);
          this.overlays.set(existKey, dot);
        }
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

  /** Get the symbol sprite at (r,c) so we can read its color for particles */
  getSymbolSprite(r: number, c: number): Phaser.GameObjects.Image | null {
    const key = `symbol_${r}_${c}`;
    const hiddenKey = `hidden_${r}_${c}`;
    for (const k of [key, hiddenKey]) {
      const obj = this.overlays.get(k);
      if (obj && obj instanceof Phaser.GameObjects.Image) {
        return obj;
      }
    }
    return null;
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
    if (this.exitRing) {
      this.exitRing.destroy();
      this.exitRing = null;
    }
    if (this.exitTween) {
      this.exitTween.destroy();
      this.exitTween = null;
    }
    if (this.exitRingTween) {
      this.exitRingTween.destroy();
      this.exitRingTween = null;
    }
    if (this.boardBorder) {
      this.boardBorder.destroy();
      this.boardBorder = null;
    }
    if (this.vignette) {
      this.vignette.destroy();
      this.vignette = null;
    }
  }
}
