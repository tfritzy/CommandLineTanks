import { UNIT_TO_PIXEL } from "../../game";
import { TerrainDetailObject } from "./TerrainDetailObject";
import { getFlashColor } from "../../utils/colors";

export class FenceEdge extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;

    const shadowOffset = UNIT_TO_PIXEL * 0.06;
    const angle = (this.rotation * 90 * Math.PI) / 180;
    const lsX = shadowOffset * (Math.sin(angle) - Math.cos(angle));
    const lsY = shadowOffset * (Math.sin(angle) + Math.cos(angle));

    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";

    ctx.beginPath();
    ctx.roundRect(x - UNIT_TO_PIXEL * 0.5 + lsX, y - UNIT_TO_PIXEL * 0.03 + lsY, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.06, 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    for (let i = 0; i < 2; i++) {
      const localX = 0.25 + i * 0.5 - 0.5;
      const worldX = centerX + UNIT_TO_PIXEL * (localX * Math.cos(angle));
      const worldY = centerY + UNIT_TO_PIXEL * (localX * Math.sin(angle));

      ctx.beginPath();
      ctx.arc(worldX - shadowOffset, worldY + shadowOffset, UNIT_TO_PIXEL * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;

    ctx.translate(centerX, centerY);
    ctx.rotate((this.rotation * 90 * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    const railColor = getFlashColor("#e39764", this.flashTimer);
    const postColor = getFlashColor("#c06852", this.flashTimer);

    ctx.fillStyle = railColor;
    ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.03, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.06);

    ctx.fillStyle = postColor;
    for (let i = 0; i < 2; i++) {
      const px = x - UNIT_TO_PIXEL * 0.5 + UNIT_TO_PIXEL * (0.25 + i * 0.5);
      ctx.beginPath();
      ctx.arc(px, y, UNIT_TO_PIXEL * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}
