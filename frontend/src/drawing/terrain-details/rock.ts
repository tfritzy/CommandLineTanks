import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";


export function drawRockShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const shadowOffset = 6;
  const shadowColor = getNeonShadowColor(COLORS.TERRAIN.ROCK_OUTLINE);
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(centerX - shadowOffset, centerY + shadowOffset, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRockBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const outlineColor = getFlashColor(COLORS.TERRAIN.ROCK_OUTLINE, flashTimer);
  const fillColor = getNeonFillColor(outlineColor);

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = fillColor;
  ctx.fill();

  setGlow(ctx, outlineColor, NEON_GLOW_BLUR_MEDIUM);
  
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.15, centerY + radius * 0.15, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX + radius * 0.15, centerY - radius * 0.15, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  setGlow(ctx, outlineColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  clearGlow(ctx);
}
