import { UNIT_TO_PIXEL } from "../game";

export abstract class TerrainDetailObject {
  protected x: number;
  protected y: number;
  protected label: string | null;
  protected health: number;

  constructor(x: number, y: number, label: string | null = null, health: number = 100) {
    this.x = x;
    this.y = y;
    this.label = label;
    this.health = health;
  }

  public abstract draw(ctx: CanvasRenderingContext2D): void;

  public abstract drawShadow(ctx: CanvasRenderingContext2D): void;

  public abstract drawBody(ctx: CanvasRenderingContext2D): void;

  protected drawLabel(ctx: CanvasRenderingContext2D): void {
    if (!this.label) return;

    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x + UNIT_TO_PIXEL * 0.5;
    const labelY = y - UNIT_TO_PIXEL * 0.1;

    ctx.font = `${UNIT_TO_PIXEL * .5 }px sans-serif`;
    ctx.fillStyle = "#e6eeed";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    
    ctx.fillText(this.label, centerX, labelY);
    
    ctx.restore();
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  protected getWorldX(): number {
    return (this.x - 0.5) * UNIT_TO_PIXEL;
  }

  protected getWorldY(): number {
    return (this.y - 0.5) * UNIT_TO_PIXEL;
  }
}
