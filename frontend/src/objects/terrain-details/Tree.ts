import { TerrainDetailObject } from "./TerrainDetailObject";
import { drawTreeShadow, drawTreeBody } from "../../drawing/terrain-details/tree";
import { TERRAIN_DETAIL_RADIUS } from "../../constants";

export class Tree extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(TERRAIN_DETAIL_RADIUS.TREE, 0.35, 7.77, 3.33);
    drawTreeShadow(ctx, centerX, centerY, radius);
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(TERRAIN_DETAIL_RADIUS.TREE, 0.35, 7.77, 3.33);
    drawTreeBody(ctx, centerX, centerY, radius, this.flashTimer);
    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public getType(): string {
    return "Tree";
  }
}
