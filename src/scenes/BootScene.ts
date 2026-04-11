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
    this.generateExitRing();
    this.generateStartDot();
    this.generateParticle();
    this.generateSparkParticle();

    this.scene.start(SCENE_KEYS.GAME);
  }

  private generateHedgehog() {
    const rt = this.add.renderTexture(0, 0, T, T);
    const g = this.add.graphics();

    // Body shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(52, 62, 62, 54);

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
    // Spike highlights
    g.fillStyle(0x7a6224, 0.5);
    g.fillTriangle(43, 32, 41, 16, 49, 30);
    g.fillTriangle(55, 30, 59, 14, 61, 30);
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
    // Nose highlight
    g.fillStyle(0xf0a050, 0.5);
    g.fillEllipse(49, 63, 4, 3);
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

    // Outer glow
    g.fillStyle(color, 0.15);
    g.fillCircle(50, 50, 48);
    // Main circle
    g.fillStyle(color, 0.85);
    g.fillCircle(50, 50, 42);
    // Inner highlight
    g.fillStyle(0xffffff, 0.12);
    g.fillCircle(50, 44, 32);
    drawContent(g);

    rt.draw(g);
    rt.saveTexture(key);
    g.destroy();
    rt.setVisible(false);
  }

  private addTextToTexture(key: string, char: string, fontSize: number, color: number) {
    const colorStr = "#" + color.toString(16).padStart(6, "0");

    const text = this.add.text(50, 50, char, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: `${fontSize}px`,
      color: colorStr,
      fontStyle: "bold",
    }).setOrigin(0.5);

    const textures = this.textures;
    if (textures.exists(key)) {
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

    // Drop shadow
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(18, 20, 70, 70, 28);

    // Stone base (dark edge = bevel)
    g.fillStyle(0x5a4d38);
    g.fillRoundedRect(15, 15, 70, 70, 28);
    // Stone face (lighter center)
    g.fillStyle(0xa08c6e);
    g.fillRoundedRect(18, 17, 64, 64, 26);
    // Highlight on top
    g.fillStyle(0xc4ad8a, 0.4);
    g.fillRoundedRect(22, 19, 56, 30, 20);
    // Inner shadow bottom
    g.fillStyle(0x6b5c44, 0.3);
    g.fillRoundedRect(22, 50, 56, 26, 14);

    rt.draw(g);
    rt.saveTexture("cell_stone");
    g.destroy();
    rt.setVisible(false);
  }

  private generateExit() {
    const rt = this.add.renderTexture(0, 0, T, T);
    const g = this.add.graphics();

    // Glow layers
    g.fillStyle(0xef9f27, 0.15);
    g.fillCircle(50, 50, 48);
    g.fillStyle(0xef9f27, 0.25);
    g.fillCircle(50, 50, 42);
    // Main circle
    g.fillStyle(0xef9f27);
    g.fillCircle(50, 50, 35);
    // Inner highlight
    g.fillStyle(0xffd76e, 0.4);
    g.fillCircle(50, 44, 24);

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

  private generateExitRing() {
    const rt = this.add.renderTexture(0, 0, T, T);
    const g = this.add.graphics();

    // Ring / halo around exit
    g.lineStyle(3, 0xef9f27, 0.6);
    g.strokeCircle(50, 50, 44);
    g.lineStyle(1.5, 0xffd76e, 0.3);
    g.strokeCircle(50, 50, 47);

    rt.draw(g);
    rt.saveTexture("exit_ring");
    g.destroy();
    rt.setVisible(false);
  }

  private generateStartDot() {
    const rt = this.add.renderTexture(0, 0, T, T);
    const g = this.add.graphics();

    g.fillStyle(0x5dcaa5, 0.2);
    g.fillCircle(50, 50, 20);
    g.fillStyle(0x5dcaa5, 0.4);
    g.fillCircle(50, 50, 15);

    rt.draw(g);
    rt.saveTexture("cell_start_dot");
    g.destroy();
    rt.setVisible(false);
  }

  private generateParticle() {
    const rt = this.add.renderTexture(0, 0, 16, 16);
    const g = this.add.graphics();

    // Soft circle particle
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(8, 8, 6);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(8, 8, 8);

    rt.draw(g);
    rt.saveTexture("particle");
    g.destroy();
    rt.setVisible(false);
  }

  private generateSparkParticle() {
    const rt = this.add.renderTexture(0, 0, 8, 8);
    const g = this.add.graphics();

    // Tiny bright spark
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 3);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(4, 4, 4);

    rt.draw(g);
    rt.saveTexture("spark");
    g.destroy();
    rt.setVisible(false);
  }
}
