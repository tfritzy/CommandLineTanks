import { UNIT_TO_PIXEL } from "../game";

export class FloatingLabel {
  private x: number;
  private y: number;
  private text: string;
  private lifetime: number = 0;
  private maxLifetime: number = 1.0;
  private isDead: boolean = false;

  constructor(x: number, y: number, text: string) {
    this.x = x;
    this.y = y;
    this.text = text;
  }

  public update(deltaTime: number): void {
    this.lifetime += deltaTime;
    this.y -= deltaTime * 0.5;

    if (this.lifetime >= this.maxLifetime) {
      this.isDead = true;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    const alpha = Math.max(0, 1 - this.lifetime / this.maxLifetime);

    ctx.save();
    ctx.translate(this.x * UNIT_TO_PIXEL, this.y * UNIT_TO_PIXEL);
    ctx.globalAlpha = alpha;
    ctx.font = "12px monospace";
    ctx.fillStyle = "#f5c47c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }

  public getIsDead(): boolean {
    return this.isDead;
  }
}
