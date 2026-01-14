import { TerrainDetailObject } from "./TerrainDetailObject";
import { UNIT_TO_PIXEL, PEN_SIZE } from "../../constants";
import { drawPenBorderBody } from "../../drawing/terrain-details/pen-border";

export class PenBorder extends TerrainDetailObject {
  constructor(
    x: number,
    y: number,
    label: string | undefined,
    health: number | undefined,
    rotation: number
  ) {
    super(x, y, label, health, rotation);
  }

  public drawShadow(_ctx: CanvasRenderingContext2D): void {
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    const gameX = this.x * UNIT_TO_PIXEL;
    const gameY = this.y * UNIT_TO_PIXEL;
    drawPenBorderBody(ctx, gameX, gameY, PEN_SIZE, PEN_SIZE);
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
}
