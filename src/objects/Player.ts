import Phaser from "phaser";
import type { Direction } from "../data/types";

export class Player extends Phaser.GameObjects.Sprite {
  baseScale = 1;
  private speedTrail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, cellSize: number) {
    super(scene, x, y, "hedgehog");
    scene.add.existing(this);
    this.baseScale = (cellSize * 0.8) / 100;
    this.setScale(this.baseScale);
    this.setDepth(5);
  }

  moveTo(x: number, y: number, dir: Direction, skipTransition: boolean) {
    if (skipTransition) {
      this.setPosition(x, y);
      this.setScale(this.baseScale);
      return;
    }

    const horiz = dir === "left" || dir === "right";

    // Stop existing tweens on this object
    this.scene.tweens.killTweensOf(this);

    // Movement + squash/stretch chain
    this.scene.tweens.add({
      targets: this,
      x, y,
      duration: 120,
      ease: "Quad.easeOut",
    });

    // Stretch phase
    const sx = horiz ? this.baseScale * 1.15 : this.baseScale * 0.87;
    const sy = horiz ? this.baseScale * 0.87 : this.baseScale * 1.15;
    this.setScale(sx, sy);

    // Squash phase after 120ms
    this.scene.time.delayedCall(120, () => {
      const sx2 = horiz ? this.baseScale * 0.9 : this.baseScale * 1.1;
      const sy2 = horiz ? this.baseScale * 1.1 : this.baseScale * 0.9;
      this.setScale(sx2, sy2);
    });

    // Back to idle after 200ms
    this.scene.time.delayedCall(200, () => {
      this.setScale(this.baseScale);
    });
  }

  updateScale(cellSize: number) {
    this.baseScale = (cellSize * 0.8) / 100;
    this.setScale(this.baseScale);
  }

  /** Start orange spark trail for speed x2 */
  startSpeedTrail(scene: Phaser.Scene) {
    if (this.speedTrail) return; // already active

    this.speedTrail = scene.add.particles(0, 0, "spark", {
      follow: this,
      speed: { min: 10, max: 30 },
      scale: { start: 1.0, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xd85a30, 0xf5a623, 0xff6b35],
      lifespan: 350,
      frequency: 30,
      gravityY: 15,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.speedTrail.setDepth(4);
  }

  /** Stop the speed trail */
  stopSpeedTrail() {
    if (this.speedTrail) {
      this.speedTrail.destroy();
      this.speedTrail = null;
    }
  }
}
