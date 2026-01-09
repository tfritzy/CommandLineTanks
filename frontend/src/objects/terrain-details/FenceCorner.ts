import { TerrainDetailObject } from "./TerrainDetailObject";
import { drawFenceCornerShadow, drawFenceCornerBody } from "../../drawing/terrain-details/fence-corner";

export class FenceCorner extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    drawFenceCornerShadow(ctx, x, y, centerX, centerY, this.rotation);
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    drawFenceCornerBody(ctx, x, y, centerX, centerY, this.rotation, this.flashTimer);
    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public getType(): string {
    return "FenceCorner";
  }

  public getTextureKey(): string {
    return `fencecorner-${this.rotation}`;
  }
}
