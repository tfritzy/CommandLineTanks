import { TerrainDetailObject } from "./TerrainDetailObject";
import { drawDeadTreeShadow, drawDeadTreeBody } from "../../drawing/terrain-details/dead-tree";
import { TERRAIN_DETAIL_RADIUS } from "../../constants";

export class DeadTree extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getGameX();
    const y = this.getGameY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(TERRAIN_DETAIL_RADIUS.TREE, 0.30, 7.77, 3.33);
    drawDeadTreeShadow(ctx, centerX, centerY, radius);
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getGameX();
    const y = this.getGameY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(TERRAIN_DETAIL_RADIUS.TREE, 0.30, 7.77, 3.33);
    drawDeadTreeBody(ctx, centerX, centerY, radius, this.flashTimer);
    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public getType(): string {
    return "DeadTree";
  }

  public getTextureKey(): string {
    return "dead-tree";
  }
}
