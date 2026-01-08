import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";

export function drawHayBaleShadow(
  _ctx: CanvasRenderingContext2D,
  _centerX: number,
  _centerY: number,
  _radius: number
) {
}

export function drawHayBaleBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const ringColor = getFlashColor(COLORS.TERRAIN.HAY_BALE_RING, flashTimer);

  ctx.fillStyle = "#000000";
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
