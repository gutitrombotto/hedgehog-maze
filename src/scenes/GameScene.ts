import Phaser from "phaser";
import type { Position, Direction } from "../data/types";
import {
  EMPTY,
  EXIT,
  TELEPORT_A,
  TELEPORT_B,
  START,
  SCENE_KEYS,
} from "../data/constants";
import { LEVELS } from "../data/levels";
import { findCell, isBlocking, isSymbol } from "../utils/engine";
import { GridManager } from "../systems/GridManager";
import { ModifierSystem } from "../systems/ModifierSystem";
import { Player } from "../objects/Player";

export class GameScene extends Phaser.Scene {
  gridManager!: GridManager;
  modifiers!: ModifierSystem;
  player!: Player;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // Public state (read by UIScene)
  currentLevel = 0;
  playerPos: Position = { r: 0, c: 0 };
  timer = 0;
  isRunning = false;
  gameStarted = false;
  levelComplete = false;
  moveCount = 0;
  completedTimes: Record<number, number> = {};

  private visited = new Set<string>();
  private lastMoveTime = 0;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  lastDir: Direction = "down";

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  create() {
    this.gridManager = new GridManager(this);
    this.modifiers = new ModifierSystem(this);

    // Dummy player, will be placed in loadLevel
    this.player = new Player(this, -100, -100, 40);

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.loadLevel(this.currentLevel);

    // Launch UI scene in parallel
    this.scene.launch(SCENE_KEYS.UI);

    // Listen for UI events
    this.events.on("ui:selectLevel", (idx: number) => {
      this.currentLevel = idx;
      this.loadLevel(idx);
    });

    this.events.on("ui:retry", () => {
      this.loadLevel(this.currentLevel);
    });

    this.events.on("ui:nextLevel", () => {
      if (this.currentLevel < LEVELS.length - 1) {
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
      }
    });

    this.events.on("modChanged", () => {
      // UIScene will pick up changes on next update
    });
  }

  update() {
    if (this.levelComplete) return;
    this.pollInput();
  }

  loadLevel(levelIdx: number) {
    this.currentLevel = levelIdx;
    const level = LEVELS[levelIdx];

    // Reset state
    this.modifiers.reset();
    this.timer = 0;
    this.isRunning = false;
    this.gameStarted = false;
    this.levelComplete = false;
    this.moveCount = 0;
    this.visited.clear();
    this.lastMoveTime = 0;
    this.lastDir = "down";

    // Stop timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = null;
    }

    // Board positioning: centered horizontally, pushed down to make room for HUD
    const boardPixelSize = level.size * Math.min(Math.floor(520 / level.size), 44);
    const offsetX = (800 - boardPixelSize) / 2;
    const offsetY = 210;

    this.gridManager.buildGrid(level, offsetX, offsetY);

    // Find start
    const start = findCell(this.gridManager.grid, START) || { r: 1, c: 1 };
    this.playerPos = { ...start };
    this.visited.add(`${start.r},${start.c}`);
    this.gridManager.markVisited(start.r, start.c);

    // Place player
    const worldPos = this.gridManager.cellToWorld(start.r, start.c);
    this.player.setPosition(worldPos.x, worldPos.y);
    this.player.updateScale(this.gridManager.cellSize);
    this.player.setDepth(5);

    // Emit level loaded
    this.events.emit("levelLoaded", levelIdx);
  }

  private pollInput() {
    if (!this.cursors) return;

    const now = this.time.now;
    const cooldown = this.modifiers.getEffectiveCooldown();
    if (now - this.lastMoveTime < cooldown) return;

    let dir: Direction | null = null;
    if (this.cursors.up.isDown) dir = "up";
    else if (this.cursors.down.isDown) dir = "down";
    else if (this.cursors.left.isDown) dir = "left";
    else if (this.cursors.right.isDown) dir = "right";

    if (!dir) return;

    this.lastMoveTime = now;

    // Start game on first input
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.isRunning = true;
      this.startTimer();
      this.events.emit("gameStarted");
    }

    // Frozen check
    if (this.modifiers.frozen) return;

    // Apply swap/invert
    let effectiveDir = dir;
    if (this.modifiers.swapLR) {
      if (effectiveDir === "left") effectiveDir = "right";
      else if (effectiveDir === "right") effectiveDir = "left";
    }
    if (this.modifiers.invertAll) {
      if (effectiveDir === "left") effectiveDir = "right";
      else if (effectiveDir === "right") effectiveDir = "left";
      else if (effectiveDir === "up") effectiveDir = "down";
      else if (effectiveDir === "down") effectiveDir = "up";
    }

    this.lastDir = effectiveDir;

    // Compute new position
    let nr = this.playerPos.r;
    let nc = this.playerPos.c;
    if (effectiveDir === "up") nr--;
    if (effectiveDir === "down") nr++;
    if (effectiveDir === "left") nc--;
    if (effectiveDir === "right") nc++;

    // Bounds check
    const grid = this.gridManager.grid;
    if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) return;
    if (isBlocking(grid[nr][nc])) return;

    const cell = grid[nr][nc];
    this.moveCount++;

    // Handle EXIT
    if (cell === EXIT) {
      this.isRunning = false;
      this.levelComplete = true;
      if (this.timerEvent) {
        this.timerEvent.destroy();
        this.timerEvent = null;
      }
      this.completedTimes[this.currentLevel] = this.timer;
      this.movePlayerTo(nr, nc, effectiveDir, false);
      this.events.emit("levelComplete", this.timer, this.moveCount);
      return;
    }

    // Handle symbols
    if (isSymbol(cell)) {
      const result = this.modifiers.handleSymbol(cell);
      this.gridManager.grid[nr][nc] = EMPTY;
      this.gridManager.removeSymbol(nr, nc);
      this.events.emit("flash", result.text, result.color);
      this.events.emit("modChanged");
      // Camera shake
      this.cameras.main.shake(200, 0.005);
    }

    // Handle teleports
    if (cell === TELEPORT_A || cell === TELEPORT_B) {
      const target = cell === TELEPORT_A ? TELEPORT_B : TELEPORT_A;
      const dest = findCell(grid, target);
      if (dest) {
        this.events.emit("flash", "Teletransporte", "#1D9E75");
        this.movePlayerTo(dest.r, dest.c, effectiveDir, true);
        return;
      }
    }

    this.movePlayerTo(nr, nc, effectiveDir, false);
  }

  private movePlayerTo(r: number, c: number, dir: Direction, skipTransition: boolean) {
    // Hide start dot if moving away from start
    const startPos = findCell(this.gridManager.grid, START);
    if (startPos) {
      if (r === startPos.r && c === startPos.c) {
        this.gridManager.hideStartDot(startPos.r, startPos.c);
      } else {
        this.gridManager.showStartDot(startPos.r, startPos.c);
      }
    }

    this.playerPos = { r, c };
    const key = `${r},${c}`;
    if (!this.visited.has(key)) {
      this.visited.add(key);
      this.gridManager.markVisited(r, c);
    }

    const worldPos = this.gridManager.cellToWorld(r, c);
    this.player.moveTo(worldPos.x, worldPos.y, dir, skipTransition);

    // Update hidden symbol visibility
    this.gridManager.updateHiddenVisibility(r, c);
  }

  private startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 10,
      loop: true,
      callback: () => {
        if (this.isRunning && !this.levelComplete) {
          this.timer += 10;
        }
      },
    });
  }
}
