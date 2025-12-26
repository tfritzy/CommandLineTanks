import { UNIT_TO_PIXEL } from "../../constants";
import { TerrainDetailObject } from "./TerrainDetailObject";
import { getFlashColor } from "../../utils/colors";
import { drawFoundationCornerShadow, drawFoundationCornerBody } from "../../drawing/terrain-details/foundation-corner";

export class FoundationCorner extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    drawFoundationCornerShadow(ctx, x, y, centerX, centerY, this.rotation);
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    drawFoundationCornerBody(ctx, x, y, centerX, centerY, this.rotation, this.flashTimer);
    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}
