import { TERRAIN_DETAIL_RADIUS } from "../../constants";
import { TerrainDetailObject } from "./TerrainDetailObject";
import { drawHayBaleShadow, drawHayBaleBody } from "../../drawing/terrain-details/hay-bale";

export class HayBale extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(TERRAIN_DETAIL_RADIUS.HAY_BALE, 0, 21.21, 12.12);
    drawHayBaleShadow(ctx, centerX, centerY, radius);
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(TERRAIN_DETAIL_RADIUS.HAY_BALE, 0, 21.21, 12.12);
    drawHayBaleBody(ctx, centerX, centerY, radius, this.flashTimer);
    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public getType(): string {
    return "HayBale";
  }

  public getTextureKey(): string {
    return "haybale";
  }
}
