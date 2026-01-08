import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";


export function drawTreeShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const shadowOffsetX = -radius * 0.4;
  const shadowOffsetY = radius * 0.4;
  const shadowColor = getNeonShadowColor(COLORS.TERRAIN.TREE_FOLIAGE);
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(centerX + shadowOffsetX, centerY + shadowOffsetY, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTreeBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const outlineColor = getFlashColor(COLORS.TERRAIN.TREE_FOLIAGE, flashTimer);
  const fillColor = getNeonFillColor(outlineColor);

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  setGlow(ctx, outlineColor, NEON_GLOW_BLUR_MEDIUM);
  
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;
  const dividerCenterX = centerX + radius * 0.4;
  const dividerCenterY = centerY - radius * 0.4;
  const dividerRadius = radius * 1.3;
  ctx.beginPath();
  ctx.arc(dividerCenterX, dividerCenterY, dividerRadius, 0, Math.PI * 2);
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
