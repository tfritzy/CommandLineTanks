import { TerrainDetailObject } from "./TerrainDetailObject";

export class Label extends TerrainDetailObject {
  public drawShadow(_ctx: CanvasRenderingContext2D): void {
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}
