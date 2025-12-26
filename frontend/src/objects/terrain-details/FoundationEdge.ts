import { UNIT_TO_PIXEL } from "../../constants";
import { TerrainDetailObject } from "./TerrainDetailObject";
import { getFlashColor } from "../../utils/colors";
import { drawFoundationEdgeShadow, drawFoundationEdgeBody } from "../../drawing/terrain-details/foundation-edge";

export class FoundationEdge extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    drawFoundationEdgeShadow(ctx, x, y, centerX, centerY, this.rotation);
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    drawFoundationEdgeBody(ctx, x, y, centerX, centerY, this.rotation, this.flashTimer);
    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}
