import { UNIT_TO_PIXEL } from "../../game";
import { TerrainDetailObject } from "./TerrainDetailObject";
import { getFlashColor } from "../../utils/colors";

export class TargetDummy extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;

    const shadowOffset = UNIT_TO_PIXEL * 0.1;
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.arc(centerX - shadowOffset, centerY + shadowOffset, UNIT_TO_PIXEL * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;

    const bodyColor = getFlashColor("#813645", this.flashTimer);
    const rimColor = getFlashColor("#c06852", this.flashTimer);
    const centerColor = getFlashColor("#f5c47c", this.flashTimer);

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = rimColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = centerColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}
