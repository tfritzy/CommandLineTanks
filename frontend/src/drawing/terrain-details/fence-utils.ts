import { getFlashColor } from "../../utils/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";

export function drawSquarePost(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  baseColor: string,
  flashTimer: number
) {
  const postColor = getFlashColor(baseColor, flashTimer);

  const halfSize = size / 2;

  ctx.fillStyle = "#000000";
  ctx.fillRect(centerX - halfSize, centerY - halfSize, size, size);

  setGlow(ctx, postColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = postColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - halfSize, centerY - halfSize, size, size);
  clearGlow(ctx);
}

export function drawSquarePostShadow(
  _ctx: CanvasRenderingContext2D,
  _centerX: number,
  _centerY: number,
  _size: number,
  _shadowOffset: number
) {
}

