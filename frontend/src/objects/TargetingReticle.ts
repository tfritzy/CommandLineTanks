import { drawTargetingReticle } from "../drawing/ui/targeting-reticle";
import type { TankIndicator } from "./TankIndicator";
import type { Tank } from "./Tank";



export class TargetingReticle implements TankIndicator {
  private tank: Tank | null = null;

  constructor(tank?: Tank) {
    this.tank = tank ?? null;
  }

  public setTank(tank: Tank): void {
    this.tank = tank;
  }

  public clearTank(): void {
    this.tank = null;
  }

  public update(_deltaTime: number): void {
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.tank || this.tank.getHealth() <= 0) return;

    const pos = this.tank.getPosition();
    drawTargetingReticle(ctx, pos.x, pos.y);
  }

  public getIsDead(): boolean {
    return false;
  }

  public kill(): void {
    this.tank = null;
  }
}
