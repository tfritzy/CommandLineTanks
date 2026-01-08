import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { drawSquarePost, drawSquarePostShadow } from "./fence-utils";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";

export function drawFenceCornerShadow(
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
  const totalHeight = railWidth + slatHeight;

  const hSlatY = y - totalHeight / 2;
  const vSlatX = x - totalHeight / 2;

  ctx.fillRect(vSlatX, hSlatY, UNIT_TO_PIXEL * 0.5 + (x - vSlatX), totalHeight);
  ctx.fillRect(vSlatX, hSlatY, totalHeight, UNIT_TO_PIXEL * 0.5 + (y - hSlatY));

  ctx.restore();
}

export function drawFenceCornerBody(
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
  const totalHeight = railWidth + slatHeight;

  const hSlatY = y - totalHeight / 2;
  const vSlatX = x - totalHeight / 2;

  ctx.fillStyle = fillColor;
  ctx.fillRect(vSlatX, hSlatY, UNIT_TO_PIXEL * 0.5 + (x - vSlatX), totalHeight);
  ctx.fillRect(vSlatX, hSlatY, totalHeight, UNIT_TO_PIXEL * 0.5 + (y - hSlatY));

  setGlow(ctx, postColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = postColor;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.rect(vSlatX, hSlatY, UNIT_TO_PIXEL * 0.5 + (x - vSlatX), totalHeight);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(vSlatX, hSlatY, totalHeight, UNIT_TO_PIXEL * 0.5 + (y - hSlatY));
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();

  const size = UNIT_TO_PIXEL * 0.22;
  drawSquarePost(ctx, centerX, centerY, size, COLORS.TERRAIN.FENCE_POST, flashTimer);
}
