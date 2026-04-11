import Phaser from "phaser";
import { SCENE_KEYS, FONT_FAMILY, CSS_COLORS, LAYOUT } from "../data/constants";
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
  private panelBg!: Phaser.GameObjects.Graphics;

  // Panel positioning
  private panelX = LAYOUT.PANEL_X;
  private panelCenterX = LAYOUT.PANEL_X + LAYOUT.PANEL_W / 2;
  private panelRight = LAYOUT.PANEL_X + LAYOUT.PANEL_W - 20;

  constructor() {
    super({ key: SCENE_KEYS.UI });
  }

  create() {
    this.gameScene = this.scene.get(SCENE_KEYS.GAME) as GameScene;

    // Draw side panel background
    this.drawPanelBackground();

    // Title
    this.add.text(this.panelCenterX, 30, "Hedgehog", {
      fontFamily: FONT_FAMILY,
      fontSize: "26px",
      color: CSS_COLORS.TEXT,
      fontStyle: "bold",
    }).setOrigin(0.5, 0);

    this.add.text(this.panelCenterX, 56, "Maze", {
      fontFamily: FONT_FAMILY,
      fontSize: "26px",
      color: CSS_COLORS.EXIT_GOLD,
      fontStyle: "bold",
    }).setOrigin(0.5, 0);

    // Subtitle
    this.add.text(this.panelCenterX, 90, "Usá las flechas para\nmover al erizo hasta la salida", {
      fontFamily: FONT_FAMILY,
      fontSize: "11px",
      color: CSS_COLORS.MUTED,
      align: "center",
    }).setOrigin(0.5, 0);

    // Separator line
    this.drawSeparator(125);

    // Level selector buttons (vertical stack, 2 per row)
    this.createLevelButtons();

    // Level name
    this.levelNameText = this.add.text(this.panelCenterX, 210, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "17px",
      color: CSS_COLORS.TEXT,
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5, 0);

    // Level subtitle
    this.levelSubtitleText = this.add.text(this.panelCenterX, 232, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "11px",
      color: CSS_COLORS.MUTED,
      align: "center",
      wordWrap: { width: LAYOUT.PANEL_W - 40 },
    }).setOrigin(0.5, 0);

    // Separator
    this.drawSeparator(258);

    // Stats section
    const statsY = 275;

    this.add.text(this.panelX + 20, statsY, "Tiempo", {
      fontFamily: FONT_FAMILY,
      fontSize: "11px",
      color: CSS_COLORS.MUTED,
    });

    this.timerText = this.add.text(this.panelRight, statsY, "0:00.00", {
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      color: CSS_COLORS.TEXT,
      fontStyle: "bold",
    }).setOrigin(1, 0);

    this.add.text(this.panelX + 20, statsY + 24, "Movimientos", {
      fontFamily: FONT_FAMILY,
      fontSize: "11px",
      color: CSS_COLORS.MUTED,
    });

    this.movesText = this.add.text(this.panelRight, statsY + 24, "0", {
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      color: CSS_COLORS.TEXT,
      fontStyle: "bold",
    }).setOrigin(1, 0);

    // Separator
    this.drawSeparator(325);

    // Active modifiers section header
    this.add.text(this.panelX + 20, 338, "Mutaciones activas", {
      fontFamily: FONT_FAMILY,
      fontSize: "11px",
      color: CSS_COLORS.DARK_MUTED,
    });

    // Start hint (on the board area, not panel)
    this.hintText = this.add.text(0, 0, "Presioná una flecha para comenzar", {
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      color: CSS_COLORS.DARK_MUTED,
    }).setOrigin(0.5, 0);

    this.hintTween = this.tweens.add({
      targets: this.hintText,
      alpha: 0.3,
      duration: 750,
      yoyo: true,
      repeat: -1,
    });

    // Legend at the bottom of panel
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

  private drawPanelBackground() {
    this.panelBg = this.add.graphics();
    // Panel shadow
    this.panelBg.fillStyle(0x000000, 0.3);
    this.panelBg.fillRoundedRect(this.panelX + 3, 13, LAYOUT.PANEL_W - 6, LAYOUT.CANVAS_H - 26, 14);
    // Panel bg
    this.panelBg.fillStyle(0x1e1b18, 0.92);
    this.panelBg.fillRoundedRect(this.panelX, 10, LAYOUT.PANEL_W - 10, LAYOUT.CANVAS_H - 20, 12);
    // Panel border
    this.panelBg.lineStyle(1, 0x3d3832, 0.7);
    this.panelBg.strokeRoundedRect(this.panelX, 10, LAYOUT.PANEL_W - 10, LAYOUT.CANVAS_H - 20, 12);
  }

  private drawSeparator(y: number) {
    const g = this.add.graphics();
    g.lineStyle(1, 0x3d3832, 0.5);
    g.lineBetween(this.panelX + 20, y, this.panelRight, y);
  }

  private createLevelButtons() {
    const y = 145;
    const btnWidth = 62;
    const btnHeight = 24;
    const gap = 5;
    const cols = 3;

    const totalRowWidth = cols * btnWidth + (cols - 1) * gap;
    const startX = this.panelCenterX - totalRowWidth / 2;

    for (let i = 0; i < LEVELS.length; i++) {
      const isActive = i === this.gameScene.currentLevel;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (btnWidth + gap) + btnWidth / 2;
      const by = y + row * (btnHeight + gap);

      const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, 0, 0)
        .setStrokeStyle(1, 0x3d3832);
      this.updateButtonStyle(bg, i, isActive);

      let labelStr = `Nivel ${i + 1}`;
      const completedTime = this.gameScene.completedTimes[i];
      if (completedTime !== undefined) {
        labelStr += ` ✓`;
      }

      const label = this.add.text(0, 0, labelStr, {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: isActive ? CSS_COLORS.LEVEL_TEXT_ACTIVE : CSS_COLORS.LEVEL_TEXT_INACTIVE,
        fontStyle: isActive ? "bold" : "normal",
      }).setOrigin(0.5);

      const container = this.add.container(x, by, [bg, label]);
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
        labelStr += ` ✓`;
      }
      label.setText(labelStr);
      label.setColor(isActive ? CSS_COLORS.LEVEL_TEXT_ACTIVE : CSS_COLORS.LEVEL_TEXT_INACTIVE);
      label.setFontStyle(isActive ? "bold" : "normal");
    }

    // Show hint — position on board center
    this.hintText.setVisible(true);
    this.hintText.setAlpha(1);
    // Position hint below the board
    const boardCenterX = this.gameScene.boardCenterX;
    const boardBottomY = this.gameScene.gridManager.boardY + this.gameScene.gridManager.boardPixelSize;
    this.hintText.setPosition(boardCenterX, boardBottomY + 12);
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

    // Flash centered on the board
    const boardCenterX = this.gameScene.boardCenterX;
    const boardCenterY = this.gameScene.boardCenterY;

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

    const startY = 358;
    const pillHeight = 24;
    const gap = 4;

    for (let i = 0; i < mods.length; i++) {
      const mod = mods[i];
      const y = startY + i * (pillHeight + gap);
      const colorNum = Phaser.Display.Color.HexStringToColor(mod.color).color;

      const pillWidth = LAYOUT.PANEL_W - 50;
      const bg = this.add.rectangle(0, 0, pillWidth, pillHeight, colorNum, 0.13)
        .setStrokeStyle(1, colorNum, 0.27);

      const label = this.add.text(0, 0, mod.label, {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: mod.color,
        fontStyle: "bold",
      }).setOrigin(0.5);

      const container = this.add.container(this.panelCenterX, y, [bg, label]);
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

    // Overlay centered on the board area
    const boardX = this.gameScene.gridManager.boardX;
    const boardY = this.gameScene.gridManager.boardY;
    const boardPx = this.gameScene.gridManager.boardPixelSize;
    const centerX = boardPx / 2;
    const centerY = boardPx / 2;

    // Semi-transparent background
    const overlay = this.add.rectangle(centerX, centerY, boardPx, boardPx, 0x000000, 0.75)
      .setDepth(20);

    // "Nivel completado" title
    const title = this.add.text(centerX, centerY - 50, "Nivel completado", {
      fontFamily: FONT_FAMILY,
      fontSize: "30px",
      color: CSS_COLORS.EXIT_GOLD,
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(21);

    // Decorative line under title
    const decor = this.add.graphics().setDepth(21);
    decor.lineStyle(2, 0xef9f27, 0.5);
    decor.lineBetween(centerX - 80, centerY - 28, centerX + 80, centerY - 28);

    // Time
    const timeText = this.add.text(centerX, centerY - 6, formatTime(time), {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      color: CSS_COLORS.WHITE,
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(21);

    // Moves
    const movesText = this.add.text(centerX, centerY + 24, `${moves} movimientos`, {
      fontFamily: FONT_FAMILY,
      fontSize: "14px",
      color: "#cccccc",
    }).setOrigin(0.5).setDepth(21);

    // Buttons
    const btnY = centerY + 68;
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

    const items: Phaser.GameObjects.GameObject[] = [overlay, title, decor, timeText, movesText, retryBg, retryLabel, retryHit];

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
    const buttonItems = items.slice(5); // retryBg, retryLabel, retryHit, and next* items
    for (const item of buttonItems) {
      btnContainer.add(item);
    }

    // Build overlay container offset by board position
    this.completeOverlay = this.add.container(boardX, boardY, [overlay, title, decor, timeText, movesText, btnContainer]);
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

    // Legend at bottom of side panel - 2 columns
    const startY = LAYOUT.CANVAS_H - 180;
    const col1X = this.panelX + 28;
    const col2X = this.panelCenterX + 10;
    const rowH = 22;

    // Section header
    this.drawSeparator(startY - 14);
    this.add.text(this.panelCenterX, startY - 8, "Leyenda", {
      fontFamily: FONT_FAMILY,
      fontSize: "10px",
      color: CSS_COLORS.DARK_MUTED,
    }).setOrigin(0.5, 0);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? col1X : col2X;
      const y = startY + 14 + row * rowH;
      const colorNum = Phaser.Display.Color.HexStringToColor(item.color).color;

      const circle = this.add.graphics();
      circle.fillStyle(colorNum, 0.25);
      circle.fillCircle(x + 9, y, 9);

      this.add.text(x + 9, y, item.icon, {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: item.color,
        fontStyle: "bold",
      }).setOrigin(0.5);

      this.add.text(x + 22, y, item.label, {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: CSS_COLORS.MUTED,
      }).setOrigin(0, 0.5);
    }
  }
}
