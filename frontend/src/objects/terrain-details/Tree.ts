import { TerrainDetailObject } from "./TerrainDetailObject";
import { getFlashColor } from "../../utils/colors";

export class Tree extends TerrainDetailObject {
  public getSizeScale(): number {
    const seed = this.getX() * 7.77 + this.getY() * 3.33;
    const pseudoRandom = (Math.abs(Math.sin(seed) * 10000) % 1);
    return 0.85 + pseudoRandom * 0.3;
  }

  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(0.7, 0.15, 7.77, 3.33);

    const shadowOffsetX = -radius * 0.4;
    const shadowOffsetY = radius * 0.4;
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(centerX + shadowOffsetX, centerY + shadowOffsetY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(0.7, 0.15, 7.77, 3.33);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = getFlashColor("#3e4c7e", this.flashTimer);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = getFlashColor("#495f94", this.flashTimer);
    ctx.beginPath();
    const dividerCenterX = centerX + radius * 0.4;
    const dividerCenterY = centerY - radius * 0.4;
    const dividerRadius = radius * 1.3;
    ctx.arc(dividerCenterX, dividerCenterY, dividerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}
