import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";
import { UNIT_TO_PIXEL } from "../../constants";

export function drawHayBaleShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const shadowColor = getNeonShadowColor(COLORS.TERRAIN.HAY_BALE_RING);
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(centerX - UNIT_TO_PIXEL * 0.15, centerY + UNIT_TO_PIXEL * 0.15, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHayBaleBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const ringColor = getFlashColor(COLORS.TERRAIN.HAY_BALE_RING, flashTimer);
  const fillColor = getNeonFillColor(ringColor);

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  setGlow(ctx, ringColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  clearGlow(ctx);
}
