import { Drawable } from "../types/Drawable";

export interface TankIndicator extends Drawable {
  update(deltaTime: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  getIsDead(): boolean;
}
