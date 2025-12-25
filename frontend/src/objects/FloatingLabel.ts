import { drawFloatingLabel } from "../drawing/ui/floating-label";
import type { TankIndicator } from "./TankIndicator";



const FLOAT_SPEED = 0.5;
const LABEL_LIFETIME = 1.0;

export class FloatingLabel implements TankIndicator {
  private x: number;
  private y: number;
  private text: string;
  private lifetime: number = 0;
  private maxLifetime: number = LABEL_LIFETIME;
  private isDead: boolean = false;

  constructor(x: number, y: number, text: string) {
    this.x = x;
    this.y = y;
    this.text = text;
  }

  public update(deltaTime: number): void {
    this.lifetime += deltaTime;
    this.y -= deltaTime * FLOAT_SPEED;

    if (this.lifetime >= this.maxLifetime) {
      this.isDead = true;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    const alpha = Math.max(0, 1 - this.lifetime / this.maxLifetime);
    drawFloatingLabel(ctx, this.x, this.y, this.text, alpha);
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
