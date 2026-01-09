import { TerrainDetailObject } from "./TerrainDetailObject";
import { drawRockShadow, drawRockBody } from "../../drawing/terrain-details/rock";
import { TERRAIN_DETAIL_RADIUS } from "../../constants";

export class Rock extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(TERRAIN_DETAIL_RADIUS.ROCK, 0, 13.37, 42.42);
    drawRockShadow(ctx, centerX, centerY, radius);
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(TERRAIN_DETAIL_RADIUS.ROCK, 0, 13.37, 42.42);
    drawRockBody(ctx, centerX, centerY, radius, this.flashTimer);
    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public getType(): string {
    return "Rock";
  }

  public getTextureKey(): string {
    return "rock";
  }
}
