import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";

export function drawFoundationCornerShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number
) {
  ctx.save();

  const shadowOffset = UNIT_TO_PIXEL * 0.08;

  ctx.translate(centerX - shadowOffset, centerY + shadowOffset);
  ctx.rotate((rotation * 90 * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  const shadowColor = getNeonShadowColor(COLORS.TERRAIN.FOUNDATION_BASE);
  ctx.fillStyle = shadowColor;
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

export function drawFoundationCornerBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number,
  flashTimer: number
) {
  ctx.save();

  ctx.translate(centerX, centerY);
  ctx.rotate((rotation * 90 * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  const baseColor = getFlashColor(COLORS.TERRAIN.FOUNDATION_BASE, flashTimer);
  const fillColor = getNeonFillColor(baseColor);

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(x - UNIT_TO_PIXEL * 0.15, y - UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y + UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.5);
  ctx.lineTo(x - UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.5);
  ctx.closePath();
  ctx.fill();

  setGlow(ctx, baseColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();
}
