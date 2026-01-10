import { TWO_PI } from "../../constants";
import { COLORS } from "../../theme/colors";


export function drawNormalProjectileShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

export function drawNormalProjectileBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, TWO_PI);
  ctx.fill();

  ctx.strokeStyle = COLORS.UI.BLACK;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
