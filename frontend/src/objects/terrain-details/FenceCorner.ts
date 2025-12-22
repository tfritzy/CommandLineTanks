import { UNIT_TO_PIXEL } from "../../game";
import { TerrainDetailObject } from "./TerrainDetailObject";
import { getFlashColor } from "../../utils/colors";

export class FenceCorner extends TerrainDetailObject {
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
    ctx.roundRect(x + lsX, y - UNIT_TO_PIXEL * 0.03 + lsY, UNIT_TO_PIXEL * 0.5, UNIT_TO_PIXEL * 0.06, 2);
    ctx.roundRect(x - UNIT_TO_PIXEL * 0.03 + lsX, y + lsY, UNIT_TO_PIXEL * 0.06, UNIT_TO_PIXEL * 0.5, 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    const size = UNIT_TO_PIXEL * 0.22;
    ctx.beginPath();
    ctx.roundRect(centerX - size / 2 - shadowOffset, centerY - size / 2 + shadowOffset, size, size, 2);
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

    const railColor = getFlashColor("#e39764", this.flashTimer);
    const postColor = getFlashColor("#c06852", this.flashTimer);

    ctx.fillStyle = railColor;
    ctx.fillRect(x, y - UNIT_TO_PIXEL * 0.03, UNIT_TO_PIXEL * 0.5, UNIT_TO_PIXEL * 0.06);
    ctx.fillRect(x - UNIT_TO_PIXEL * 0.03, y, UNIT_TO_PIXEL * 0.06, UNIT_TO_PIXEL * 0.5);

    ctx.fillStyle = postColor;
    const size = UNIT_TO_PIXEL * 0.22;
    ctx.beginPath();
    ctx.roundRect(centerX - size / 2, centerY - size / 2, size, size, 2);
    ctx.fill();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }
}
