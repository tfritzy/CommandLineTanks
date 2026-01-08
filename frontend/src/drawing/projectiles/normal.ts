import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";


export function drawNormalProjectileShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string
) {
  ctx.save();
  const shadowColor = getNeonShadowColor(color);
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(centerX - 2, centerY + 2, radius, 0, Math.PI * 2);
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
  
  const fillColor = getNeonFillColor(color);
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  setGlow(ctx, color, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  clearGlow(ctx);
  ctx.restore();
}
