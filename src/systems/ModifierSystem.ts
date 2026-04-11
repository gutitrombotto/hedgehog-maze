import Phaser from "phaser";
import type { ActiveMod } from "../data/types";
import {
  SWAP_DIR,
  FREEZE,
  SPEED_X2,
  INVERT_ALL,
  MOVE_COOLDOWN,
  FREEZE_DURATION,
  SPEED_DURATION,
  CSS_COLORS,
} from "../data/constants";
import { resolveHiddenType } from "../utils/engine";

export class ModifierSystem {
  swapLR = false;
  invertAll = false;
  frozen = false;
  speedX2 = false;

  private freezeEvent: Phaser.Time.TimerEvent | null = null;
  private speedEvent: Phaser.Time.TimerEvent | null = null;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  handleSymbol(cell: number): { text: string; color: string } {
    const type = resolveHiddenType(cell);

    if (type === SWAP_DIR) {
      this.swapLR = !this.swapLR;
      return { text: "Izquierda ↔ Derecha", color: CSS_COLORS.SWAP };
    }
    if (type === FREEZE) {
      this.frozen = true;
      if (this.freezeEvent) this.freezeEvent.destroy();
      this.freezeEvent = this.scene.time.delayedCall(FREEZE_DURATION, () => {
        this.frozen = false;
        this.scene.events.emit("modChanged");
      });
      return { text: "Congelado 2.5s", color: CSS_COLORS.FREEZE };
    }
    if (type === SPEED_X2) {
      this.speedX2 = true;
      if (this.speedEvent) this.speedEvent.destroy();
      this.speedEvent = this.scene.time.delayedCall(SPEED_DURATION, () => {
        this.speedX2 = false;
        this.scene.events.emit("modChanged");
      });
      return { text: "Velocidad x2", color: CSS_COLORS.SPEED };
    }
    if (type === INVERT_ALL) {
      this.invertAll = !this.invertAll;
      return { text: "Controles invertidos", color: CSS_COLORS.INVERT };
    }

    return { text: "", color: "" };
  }

  getActiveMods(): ActiveMod[] {
    const mods: ActiveMod[] = [];
    if (this.swapLR) mods.push({ label: "Izq ↔ Der", color: CSS_COLORS.SWAP });
    if (this.invertAll) mods.push({ label: "Invertido", color: CSS_COLORS.INVERT });
    if (this.frozen) mods.push({ label: "Congelado", color: CSS_COLORS.FREEZE });
    if (this.speedX2) mods.push({ label: "Velocidad x2", color: CSS_COLORS.SPEED });
    return mods;
  }

  getEffectiveCooldown(): number {
    return this.speedX2 ? MOVE_COOLDOWN / 2 : MOVE_COOLDOWN;
  }

  reset() {
    this.swapLR = false;
    this.invertAll = false;
    this.frozen = false;
    this.speedX2 = false;
    if (this.freezeEvent) this.freezeEvent.destroy();
    if (this.speedEvent) this.speedEvent.destroy();
    this.freezeEvent = null;
    this.speedEvent = null;
  }
}
