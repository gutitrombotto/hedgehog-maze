import Phaser from "phaser";
import { SCENE_KEYS, FONT_FAMILY, CSS_COLORS } from "../data/constants";
import { LEVELS } from "../data/levels";
import { formatTime } from "../utils/engine";
import type { GameScene } from "./GameScene";

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;

  // HUD elements
  private levelNameText!: Phaser.GameObjects.Text;
  private levelSubtitleText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private hintTween: Phaser.Tweens.Tween | null = null;
  private levelButtons: Phaser.GameObjects.Container[] = [];
  private modPills: Phaser.GameObjects.Container[] = [];
  private flashText: Phaser.GameObjects.Text | null = null;
  private flashBg: Phaser.GameObjects.Rectangle | null = null;
  private completeOverlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: SCENE_KEYS.UI });
  }

  create() {
    this.gameScene = this.scene.get(SCENE_KEYS.GAME) as GameScene;

    // Title
    this.add.text(400, 20, "Hedgehog Maze", {
      fontFamily: FONT_FAMILY,
      fontSize: "28px",
      color: CSS_COLORS.TEXT,
      fontStyle: "bold",
    }).setOrigin(0.5, 0);

    // Subtitle
    this.add.text(400, 52, "Usá las flechas del teclado para mover al erizo hasta la salida", {
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      color: CSS_COLORS.MUTED,
    }).setOrigin(0.5, 0);

    // Level selector buttons
    this.createLevelButtons();

    // Level name
    this.levelNameText = this.add.text(400, 112, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: CSS_COLORS.TEXT,
      fontStyle: "bold",
    }).setOrigin(0.5, 0);

    // Level subtitle
    this.levelSubtitleText = this.add.text(400, 134, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      color: CSS_COLORS.MUTED,
    }).setOrigin(0.5, 0);

    // Stats
    const statsY = 156;
    this.add.text(300, statsY, "Tiempo ", {
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      color: CSS_COLORS.MUTED,
    }).setOrigin(1, 0);

    this.timerText = this.add.text(302, statsY, "0:00.00", {
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      color: CSS_COLORS.TEXT,
      fontStyle: "bold",
    }).setOrigin(0, 0);

    this.add.text(455, statsY, "Movimientos ", {
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      color: CSS_COLORS.MUTED,
    }).setOrigin(1, 0);

    this.movesText = this.add.text(457, statsY, "0", {
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      color: CSS_COLORS.TEXT,
      fontStyle: "bold",
    }).setOrigin(0, 0);

    // Start hint
    this.hintText = this.add.text(400, 185, "Presioná una flecha para comenzar", {
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      color: CSS_COLORS.DARK_MUTED,
    }).setOrigin(0.5, 0);

    this.hintTween = this.tweens.add({
      targets: this.hintText,
      alpha: 0.3,
      duration: 750,
      yoyo: true,
      repeat: -1,
    });

    // Legend
    this.createLegend();

    // Listen for game events
    this.gameScene.events.on("levelLoaded", (idx: number) => {
      this.onLevelLoaded(idx);
    });

    this.gameScene.events.on("gameStarted", () => {
      this.hintText.setVisible(false);
      if (this.hintTween) this.hintTween.pause();
    });

    this.gameScene.events.on("flash", (text: string, color: string) => {
      this.showFlash(text, color);
    });

    this.gameScene.events.on("levelComplete", (time: number, moves: number) => {
      this.showCompleteOverlay(time, moves);
    });

    this.gameScene.events.on("modChanged", () => {
      this.updateModPills();
    });

    // Initial level load
    this.onLevelLoaded(0);
  }

  update() {
    // High-frequency updates from GameScene
    if (this.gameScene) {
      this.timerText.setText(formatTime(this.gameScene.timer));
      this.movesText.setText(String(this.gameScene.moveCount));
      this.updateModPills();
    }
  }

  private createLevelButtons() {
    const startX = 400 - ((LEVELS.length * 80 + (LEVELS.length - 1) * 6) / 2);
    const y = 78;

    for (let i = 0; i < LEVELS.length; i++) {
      const isActive = i === this.gameScene.currentLevel;
      const btnWidth = 80;
      const btnHeight = 26;
      const x = startX + i * (btnWidth + 6) + btnWidth / 2;

      const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, 0, 0)
        .setStrokeStyle(1, 0x3d3832);
      this.updateButtonStyle(bg, i, isActive);

      let labelStr = `Nivel ${i + 1}`;
      const completedTime = this.gameScene.completedTimes[i];
      if (completedTime !== undefined) {
        labelStr += ` ${formatTime(completedTime)}`;
      }

      const label = this.add.text(0, 0, labelStr, {
        fontFamily: FONT_FAMILY,
        fontSize: "12px",
        color: isActive ? CSS_COLORS.LEVEL_TEXT_ACTIVE : CSS_COLORS.LEVEL_TEXT_INACTIVE,
        fontStyle: isActive ? "bold" : "normal",
      }).setOrigin(0.5);

      const container = this.add.container(x, y, [bg, label]);
      container.setSize(btnWidth, btnHeight);
      container.setInteractive();
      container.on("pointerdown", () => {
        this.gameScene.events.emit("ui:selectLevel", i);
      });
      container.on("pointerover", () => {
        bg.setStrokeStyle(1, 0x6b6258);
      });
      container.on("pointerout", () => {
        bg.setStrokeStyle(1, 0x3d3832);
      });

      this.levelButtons.push(container);
    }
  }

  private updateButtonStyle(bg: Phaser.GameObjects.Rectangle, _idx: number, isActive: boolean) {
    if (isActive) {
      bg.setFillStyle(0xe8dcc8);
    } else {
      bg.setFillStyle(0x2a2522);
    }
  }

  private onLevelLoaded(idx: number) {
    const level = LEVELS[idx];
    this.levelNameText.setText(level.name);
    this.levelSubtitleText.setText(level.subtitle);

    // Update button styles
    for (let i = 0; i < this.levelButtons.length; i++) {
      const container = this.levelButtons[i];
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      const label = container.getAt(1) as Phaser.GameObjects.Text;
      const isActive = i === idx;

      this.updateButtonStyle(bg, i, isActive);

      let labelStr = `Nivel ${i + 1}`;
      const completedTime = this.gameScene.completedTimes[i];
      if (completedTime !== undefined) {
        labelStr += ` ${formatTime(completedTime)}`;
      }
      label.setText(labelStr);
      label.setColor(isActive ? CSS_COLORS.LEVEL_TEXT_ACTIVE : CSS_COLORS.LEVEL_TEXT_INACTIVE);
      label.setFontStyle(isActive ? "bold" : "normal");
    }

    // Show hint
    this.hintText.setVisible(true);
    this.hintText.setAlpha(1);
    if (this.hintTween) {
      this.hintTween.resume();
    }

    // Clear active mod pills
    this.clearModPills();

    // Clear complete overlay
    this.hideCompleteOverlay();
  }

  private showFlash(text: string, color: string) {
    // Remove previous flash
    if (this.flashText) this.flashText.destroy();
    if (this.flashBg) this.flashBg.destroy();

    const level = LEVELS[this.gameScene.currentLevel];
    const cellSize = Math.min(Math.floor(520 / level.size), 44);
    const boardPixelSize = level.size * cellSize;
    const boardCenterX = 400;
    const boardCenterY = 210 + boardPixelSize / 2;

    this.flashText = this.add.text(boardCenterX, boardCenterY, text, {
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      color: CSS_COLORS.WHITE,
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(30);

    const padding = 24;
    this.flashBg = this.add.rectangle(
      boardCenterX,
      boardCenterY,
      this.flashText.width + padding * 2,
      this.flashText.height + 20,
      Phaser.Display.Color.HexStringToColor(color).color,
      0.87
    ).setDepth(29);

    // Fade up animation
    const targets = [this.flashText, this.flashBg];
    this.tweens.add({
      targets,
      y: `-=40`,
      alpha: 0,
      duration: 1500,
      ease: "Power2",
      delay: 500,
      onComplete: () => {
        if (this.flashText) { this.flashText.destroy(); this.flashText = null; }
        if (this.flashBg) { this.flashBg.destroy(); this.flashBg = null; }
      },
    });
  }

  private updateModPills() {
    this.clearModPills();
    const mods = this.gameScene.modifiers.getActiveMods();
    if (mods.length === 0) return;

    const startX = 400 - ((mods.length * 100 + (mods.length - 1) * 6) / 2);
    const y = 195;

    for (let i = 0; i < mods.length; i++) {
      const mod = mods[i];
      const x = startX + i * 106 + 50;
      const colorNum = Phaser.Display.Color.HexStringToColor(mod.color).color;

      const bg = this.add.rectangle(0, 0, 96, 22, colorNum, 0.13)
        .setStrokeStyle(1, colorNum, 0.27);

      const label = this.add.text(0, 0, mod.label, {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: mod.color,
        fontStyle: "bold",
      }).setOrigin(0.5);

      const container = this.add.container(x, y, [bg, label]);
      this.modPills.push(container);
    }
  }

  private clearModPills() {
    for (const pill of this.modPills) {
      pill.destroy();
    }
    this.modPills = [];
  }

  private showCompleteOverlay(time: number, moves: number) {
    this.hideCompleteOverlay();

    const level = LEVELS[this.gameScene.currentLevel];
    const cellSize = Math.min(Math.floor(520 / level.size), 44);
    const boardPixelSize = level.size * cellSize;
    const boardX = (800 - boardPixelSize) / 2;
    const boardY = 210;
    const centerX = boardPixelSize / 2;
    const centerY = boardPixelSize / 2;

    // Semi-transparent background
    const overlay = this.add.rectangle(centerX, centerY, boardPixelSize, boardPixelSize, 0x000000, 0.7)
      .setDepth(20);

    // "Nivel completado" title
    const title = this.add.text(centerX, centerY - 40, "Nivel completado", {
      fontFamily: FONT_FAMILY,
      fontSize: "32px",
      color: CSS_COLORS.EXIT_GOLD,
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(21);

    // Time
    const timeText = this.add.text(centerX, centerY, formatTime(time), {
      fontFamily: FONT_FAMILY,
      fontSize: "20px",
      color: CSS_COLORS.WHITE,
    }).setOrigin(0.5).setDepth(21);

    // Moves
    const movesText = this.add.text(centerX, centerY + 26, `${moves} movimientos`, {
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      color: "#cccccc",
    }).setOrigin(0.5).setDepth(21);

    // Buttons
    const btnY = centerY + 64;
    const retryBg = this.add.rectangle(-80, 0, 110, 34, 0x000000, 0)
      .setStrokeStyle(1, 0xffffff, 0.4)
      .setDepth(21);
    const retryLabel = this.add.text(-80, 0, "Reintentar", {
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      color: CSS_COLORS.WHITE,
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(21);
    const retryHit = this.add.rectangle(-80, 0, 110, 34, 0x000000, 0).setDepth(22);
    retryHit.setInteractive({ useHandCursor: true });
    retryHit.on("pointerdown", () => {
      this.gameScene.events.emit("ui:retry");
    });
    retryHit.on("pointerover", () => retryBg.setStrokeStyle(1, 0xffffff, 0.7));
    retryHit.on("pointerout", () => retryBg.setStrokeStyle(1, 0xffffff, 0.4));

    const items: Phaser.GameObjects.GameObject[] = [overlay, title, timeText, movesText, retryBg, retryLabel, retryHit];

    if (this.gameScene.currentLevel < LEVELS.length - 1) {
      const nextBg = this.add.rectangle(75, 0, 140, 34, 0xef9f27)
        .setDepth(21);
      const nextLabel = this.add.text(75, 0, "Siguiente nivel →", {
        fontFamily: FONT_FAMILY,
        fontSize: "13px",
        color: CSS_COLORS.EXIT_DARK,
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(21);
      const nextHit = this.add.rectangle(75, 0, 140, 34, 0x000000, 0).setDepth(22);
      nextHit.setInteractive({ useHandCursor: true });
      nextHit.on("pointerdown", () => {
        this.gameScene.events.emit("ui:nextLevel");
      });
      nextHit.on("pointerover", () => nextBg.setFillStyle(0xf5b347));
      nextHit.on("pointerout", () => nextBg.setFillStyle(0xef9f27));
      items.push(nextBg, nextLabel, nextHit);
    }

    const btnContainer = this.add.container(centerX, btnY, []);
    // Move button items to btnContainer
    const buttonItems = items.slice(4);
    for (const item of buttonItems) {
      btnContainer.add(item);
    }

    // Build overlay container offset by board position
    this.completeOverlay = this.add.container(boardX, boardY, [overlay, title, timeText, movesText, btnContainer]);
    this.completeOverlay.setDepth(20);
  }

  private hideCompleteOverlay() {
    if (this.completeOverlay) {
      this.completeOverlay.destroy();
      this.completeOverlay = null;
    }
  }

  private createLegend() {
    const items = [
      { icon: "▓", label: "Muro", color: "#2a2522" },
      { icon: "●", label: "Piedra", color: "#8B7355" },
      { icon: "@", label: "Puente", color: "#1D9E75" },
      { icon: "↔", label: "Swap", color: "#7F77DD" },
      { icon: "✱", label: "Freeze", color: "#378ADD" },
      { icon: "x2", label: "Speed", color: "#D85A30" },
      { icon: "!", label: "Invertir", color: "#E24B4A" },
      { icon: "?", label: "Oculto", color: "#888888" },
    ];

    const y = 675;
    const totalWidth = items.length * 72;
    const startX = 400 - totalWidth / 2;
    const children: Phaser.GameObjects.GameObject[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const x = startX + i * 72;
      const colorNum = Phaser.Display.Color.HexStringToColor(item.color).color;

      const circle = this.add.graphics();
      circle.fillStyle(colorNum, 0.2);
      circle.fillCircle(x + 9, y, 9);

      const iconText = this.add.text(x + 9, y, item.icon, {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: item.color,
        fontStyle: "bold",
      }).setOrigin(0.5);

      const labelText = this.add.text(x + 22, y, item.label, {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: CSS_COLORS.MUTED,
      }).setOrigin(0, 0.5);

      children.push(circle, iconText, labelText);
    }

    this.add.container(0, 0, children);
  }
}
