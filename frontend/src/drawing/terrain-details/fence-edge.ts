import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { drawSquarePost, drawSquarePostShadow } from "./fence-utils";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";

export function drawFenceEdgeShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number
) {
  const shadowOffset = UNIT_TO_PIXEL * 0.10;
  const angle = (rotation * 90 * Math.PI) / 180;

  const size = UNIT_TO_PIXEL * 0.22;
  drawSquarePostShadow(ctx, centerX, centerY, size, shadowOffset, COLORS.TERRAIN.FENCE_POST);

  ctx.save();
  ctx.translate(-shadowOffset, shadowOffset);
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.translate(-centerX, -centerY);

  const shadowColor = getNeonShadowColor(COLORS.TERRAIN.FENCE_POST);
  ctx.fillStyle = shadowColor;
  const railWidth = UNIT_TO_PIXEL * 0.05;
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const barWidth = railWidth + slatHeight;
  const barY = y - barWidth / 2;

  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, barY, UNIT_TO_PIXEL, barWidth);
  ctx.restore();
}

export function drawFenceEdgeBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number,
  flashTimer: number
) {
  const angle = (rotation * 90 * Math.PI) / 180;
  const postColor = getFlashColor(COLORS.TERRAIN.FENCE_POST, flashTimer);
  const fillColor = getNeonFillColor(postColor);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.translate(-centerX, -centerY);

  const railWidth = UNIT_TO_PIXEL * 0.05;
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const barWidth = railWidth + slatHeight;
  const barY = y - barWidth / 2;

  ctx.fillStyle = fillColor;
  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, barY, UNIT_TO_PIXEL, barWidth);

  setGlow(ctx, postColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = postColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x - UNIT_TO_PIXEL * 0.5, barY, UNIT_TO_PIXEL, barWidth);
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();

  const size = UNIT_TO_PIXEL * 0.22;
  drawSquarePost(ctx, centerX, centerY, size, COLORS.TERRAIN.FENCE_POST, flashTimer);
}
