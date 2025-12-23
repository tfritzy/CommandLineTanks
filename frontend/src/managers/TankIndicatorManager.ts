import { TankIndicator } from "../objects/TankIndicator";
import { FloatingLabel } from "../objects/FloatingLabel";
import { DrawableManager } from "./DrawableManager";

export class TankIndicatorManager extends DrawableManager<TankIndicator> {
  public spawnFloatingLabel(x: number, y: number, text: string): void {
    const label = new FloatingLabel(x, y, text);
    this.add(label);
  }

  public addIndicator(indicator: TankIndicator): void {
    this.add(indicator);
  }
}
