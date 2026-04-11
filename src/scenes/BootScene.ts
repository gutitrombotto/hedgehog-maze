import Phaser from "phaser";
import { SCENE_KEYS } from "../data/constants";

const T = 100; // texture size

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  async create() {
    // Wait for Google Fonts to load before generating text textures
    await document.fonts.ready;

    this.generateHedgehog();
    this.generateSymbol("symbol_swap", 0x7f77dd, (g) => {
      // Two arrows
      g.fillStyle(0xffffff);
      g.fillTriangle(25, 38, 50, 28, 50, 48);
      g.fillTriangle(75, 62, 50, 72, 50, 52);
    });
    this.generateSymbol("symbol_freeze", 0x378add, () => {
      this.addTextToTexture("symbol_freeze", "*", 42, 0xffffff);
    });
    this.generateSymbol("symbol_speed", 0xd85a30, () => {
      this.addTextToTexture("symbol_speed", "x2", 34, 0xffffff);
    });
    this.generateSymbol("symbol_invert", 0xe24b4a, () => {
      this.addTextToTexture("symbol_invert", "!", 38, 0xffffff);
    });
    this.generateSymbol("symbol_teleport", 0x1d9e75, () => {
      this.addTextToTexture("symbol_teleport", "@", 34, 0xffffff);
    });
    this.generateStone();
    this.generateExit();
    this.generateStartDot();

    this.scene.start(SCENE_KEYS.GAME);
  }

  private generateHedgehog() {
    const rt = this.add.renderTexture(0, 0, T, T);
    const g = this.add.graphics();

    // Body
    g.fillStyle(0x8b6914);
    g.fillEllipse(50, 58, 60, 52);
    // Belly
    g.fillStyle(0xf5deb3);
    g.fillEllipse(50, 62, 44, 36);
    // Spikes
    g.fillStyle(0x5c4a1e);
    g.fillTriangle(30, 40, 22, 20, 38, 35);
    g.fillTriangle(42, 32, 40, 10, 52, 28);
    g.fillTriangle(54, 30, 58, 8, 62, 28);
    g.fillTriangle(64, 34, 72, 14, 68, 36);
    g.fillTriangle(72, 42, 82, 24, 74, 44);
    // Eyes
    g.fillStyle(0x1a1a1a);
    g.fillCircle(40, 55, 4);
    g.fillCircle(60, 55, 4);
    // Eye highlights
    g.fillStyle(0xffffff);
    g.fillCircle(41.5, 53.5, 1.5);
    g.fillCircle(61.5, 53.5, 1.5);
    // Nose
    g.fillStyle(0xd2691e);
    g.fillEllipse(50, 64, 8, 6);
    // Mouth
    g.lineStyle(1.5, 0x6b4226);
    g.beginPath();
    g.arc(50, 66, 6, Phaser.Math.DegToRad(10), Phaser.Math.DegToRad(170), false);
    g.strokePath();

    rt.draw(g);
    rt.saveTexture("hedgehog");
    g.destroy();
    rt.setVisible(false);
  }

  private generateSymbol(key: string, color: number, drawContent: (g: Phaser.GameObjects.Graphics) => void) {
    const rt = this.add.renderTexture(0, 0, T, T);
    const g = this.add.graphics();

    g.fillStyle(color, 0.85);
    g.fillCircle(50, 50, 45);
    drawContent(g);

    rt.draw(g);
    rt.saveTexture(key);
    g.destroy();
    rt.setVisible(false);
  }

  private addTextToTexture(key: string, char: string, fontSize: number, color: number) {
    const colorStr = "#" + color.toString(16).padStart(6, "0");

    // Create a new render texture approach: draw text on existing texture
    const text = this.add.text(50, 50, char, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: `${fontSize}px`,
      color: colorStr,
      fontStyle: "bold",
    }).setOrigin(0.5);

    // We need to re-get the RT and draw the text on it
    // Since the RT was just created by generateSymbol, find it
    const textures = this.textures;
    if (textures.exists(key)) {
      // The texture already has the circle, we need to add text
      // Use a separate RT to composite
      const rt2 = this.add.renderTexture(0, 0, T, T);
      rt2.draw(key, 0, 0);
      rt2.draw(text);
      textures.remove(key);
      rt2.saveTexture(key);
      rt2.setVisible(false);
    }
    text.destroy();
  }

  private generateStone() {
    const rt = this.add.renderTexture(0, 0, T, T);
    const g = this.add.graphics();

    // Stone with gradient-like effect
    g.fillStyle(0x6b5c44);
    g.fillRoundedRect(15, 15, 70, 70, 28);
    g.fillStyle(0xa08c6e);
    g.fillRoundedRect(17, 17, 64, 64, 26);
    // Shadow
    g.fillStyle(0x6b5c44, 0.3);
    g.fillRoundedRect(22, 22, 60, 60, 24);

    rt.draw(g);
    rt.saveTexture("cell_stone");
    g.destroy();
    rt.setVisible(false);
  }

  private generateExit() {
    const rt = this.add.renderTexture(0, 0, T, T);
    const g = this.add.graphics();

    // Glow
    g.fillStyle(0xef9f27, 0.3);
    g.fillCircle(50, 50, 42);
    // Main circle
    g.fillStyle(0xef9f27);
    g.fillCircle(50, 50, 35);

    const text = this.add.text(50, 50, "S", {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: "35px",
      color: "#412402",
      fontStyle: "bold",
    }).setOrigin(0.5);

    rt.draw(g);
    rt.draw(text);
    rt.saveTexture("cell_exit");
    g.destroy();
    text.destroy();
    rt.setVisible(false);
  }

  private generateStartDot() {
    const rt = this.add.renderTexture(0, 0, T, T);
    const g = this.add.graphics();

    g.fillStyle(0x5dcaa5, 0.4);
    g.fillCircle(50, 50, 15);

    rt.draw(g);
    rt.saveTexture("cell_start_dot");
    g.destroy();
    rt.setVisible(false);
  }
}
