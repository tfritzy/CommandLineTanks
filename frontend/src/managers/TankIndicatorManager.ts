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

  public destroy(): void {
    this.indicators.length = 0;
  }

  public update(deltaTime: number): void {
    let writeIndex = 0;
    for (let i = 0; i < this.indicators.length; i++) {
      this.indicators[i].update(deltaTime);
      if (!this.indicators[i].getIsDead()) {
        if (writeIndex !== i) {
          this.indicators[writeIndex] = this.indicators[i];
        }
        writeIndex++;
      }
    }
    this.indicators.length = writeIndex;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const indicator of this.indicators) {
      indicator.draw(ctx);
    }
  }
}
