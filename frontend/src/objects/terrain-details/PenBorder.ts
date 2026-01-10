import { TerrainDetailObject } from "./TerrainDetailObject";
import { UNIT_TO_PIXEL } from "../../constants";
import { drawPenBorderBody } from "../../drawing/terrain-details/pen-border";

export class PenBorder extends TerrainDetailObject {
  private width: number;
  private height: number;

  constructor(
    x: number,
    y: number,
    label: string | undefined,
    health: number | undefined,
    rotation: number,
    width: number,
    height: number
  ) {
    super(x, y, label, health, rotation);
    this.width = width;
    this.height = height;
  }

  public drawShadow(_ctx: CanvasRenderingContext2D): void {
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    const worldX = this.x * UNIT_TO_PIXEL;
    const worldY = this.y * UNIT_TO_PIXEL;
    drawPenBorderBody(ctx, worldX, worldY, this.width, this.height);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public getType(): string {
    return "PenBorder";
  }

  public getTextureKey(): string {
    return "penborder";
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }
}
