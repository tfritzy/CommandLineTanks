import { COLORS } from "../../theme/colors";


export function drawNormalProjectileShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  ctx.save();
  ctx.fillStyle = COLORS.GAME.SHADOW_LIGHT;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
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
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLORS.UI.BLACK;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
