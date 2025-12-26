import { TerrainDetailObject } from "./TerrainDetailObject";
import { drawTargetDummyShadow, drawTargetDummyBody } from "../../drawing/terrain-details/target-dummy";

export class TargetDummy extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    drawTargetDummyShadow(ctx, centerX, centerY);
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    drawTargetDummyBody(ctx, centerX, centerY, this.flashTimer);
    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}
