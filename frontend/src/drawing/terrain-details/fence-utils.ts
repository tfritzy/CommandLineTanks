import { getFlashColor } from "../../utils/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";

export function drawSquarePost(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  baseColor: string,
  flashTimer: number
) {
  const postColor = getFlashColor(baseColor, flashTimer);
  const fillColor = getNeonFillColor(postColor);

  const halfSize = size / 2;

  ctx.fillStyle = fillColor;
  ctx.fillRect(centerX - halfSize, centerY - halfSize, size, size);

  setGlow(ctx, postColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = postColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - halfSize, centerY - halfSize, size, size);
  clearGlow(ctx);
}

export function drawSquarePostShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  shadowOffset: number,
  baseColor: string
) {
  const shadowColor = getNeonShadowColor(baseColor);
  ctx.fillStyle = shadowColor;
  ctx.fillRect(centerX - size / 2 - shadowOffset, centerY - size / 2 + shadowOffset, size, size);
}

