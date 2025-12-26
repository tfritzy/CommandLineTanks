import { TerrainDetailObject, TerrainDetailType } from "./TerrainDetailObject";
import { getFlashColor } from "../../utils/colors";

export class Rock extends TerrainDetailObject {
  public drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(0.38, 0, 13.37, 42.42);

    const shadowOffset = radius * 0.2;
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";

    ctx.beginPath();
    ctx.arc(centerX - shadowOffset, centerY + shadowOffset, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public drawBody(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const x = this.getWorldX();
    const y = this.getWorldY();
    const centerX = x;
    const centerY = y;
    const radius = this.getRadius(0.38, 0, 13.37, 42.42);

    const bodyColor = getFlashColor("#4a4b5b", this.flashTimer);
    const shadowColor = getFlashColor("#3e3f4d", this.flashTimer);
    const highlightColor = getFlashColor("#565769", this.flashTimer);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = bodyColor;
    ctx.fill();

    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.15, centerY + radius * 0.15, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.arc(centerX + radius * 0.15, centerY - radius * 0.15, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = getFlashColor("#2e2e43", this.flashTimer);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    this.drawLabel(ctx);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    this.drawShadow(ctx);
    this.drawBody(ctx);
  }

  public getType(): TerrainDetailType {
    return TerrainDetailType.Rock;
  }
}
