import type { TankIndicator } from "../objects/TankIndicator";
import { FloatingLabel } from "../objects/FloatingLabel";

export class TankIndicatorManager {
  private indicators: TankIndicator[] = [];

  public spawnFloatingLabel(x: number, y: number, text: string): void {
    const label = new FloatingLabel(x, y, text);
    this.indicators.push(label);
  }

  public addIndicator(indicator: TankIndicator): void {
    this.indicators.push(indicator);
  }

  public update(deltaTime: number): void {
    for (let i = this.indicators.length - 1; i >= 0; i--) {
      this.indicators[i].update(deltaTime);
      if (this.indicators[i].getIsDead()) {
        this.indicators.splice(i, 1);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const indicator of this.indicators) {
      indicator.draw(ctx);
    }
  }
}
