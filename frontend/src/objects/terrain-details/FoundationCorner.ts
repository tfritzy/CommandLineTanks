import { UNIT_TO_PIXEL } from "../../game";
import { TerrainDetailObject } from "./TerrainDetailObject";
import { getFlashColor } from "../../utils/colors";

export class FoundationCorner extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const shadowOffset = UNIT_TO_PIXEL * 0.08;

    ctx.translate(centerX - shadowOffset, centerY + shadowOffset);
    ctx.rotate((this.rotation * 90 * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.moveTo(x - UNIT_TO_PIXEL * 0.15, y - UNIT_TO_PIXEL * 0.15);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y + UNIT_TO_PIXEL * 0.15);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.15);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.5);
    ctx.lineTo(x - UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.5);
    ctx.closePath();
    ctx.fill();
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

    const baseColor = getFlashColor("#707b89", this.flashTimer);

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(x - UNIT_TO_PIXEL * 0.15, y - UNIT_TO_PIXEL * 0.15);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y + UNIT_TO_PIXEL * 0.15);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.15);
    ctx.lineTo(x + UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.5);
    ctx.lineTo(x - UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}
