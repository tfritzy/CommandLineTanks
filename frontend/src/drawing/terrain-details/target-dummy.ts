import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";

export function drawTargetDummyShadow(
  _ctx: CanvasRenderingContext2D,
  _centerX: number,
  _centerY: number
) {
}

export function drawTargetDummyBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  flashTimer: number
) {
  const rimColor = getFlashColor(COLORS.TERRAIN.TARGET_DUMMY_RIM, flashTimer);
  const centerColor = getFlashColor(COLORS.TERRAIN.TARGET_DUMMY_CENTER, flashTimer);

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.4, 0, Math.PI * 2);
  ctx.fill();

  setGlow(ctx, rimColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.25, 0, Math.PI * 2);
  ctx.stroke();
  clearGlow(ctx);

  setGlow(ctx, centerColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.fillStyle = centerColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.1, 0, Math.PI * 2);
  ctx.fill();
  clearGlow(ctx);
}
