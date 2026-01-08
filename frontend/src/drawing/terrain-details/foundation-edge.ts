import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";

export function drawFoundationEdgeShadow(
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
  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.3);
  ctx.restore();
}

export function drawFoundationEdgeBody(
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
  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.3);

  setGlow(ctx, baseColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.3);
  clearGlow(ctx);

  ctx.restore();
}
