import { getFlashColor, lerpColor } from "../../utils/colors";

export function drawSquarePost(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  baseColor: string,
  flashTimer: number
) {
  const postColor = getFlashColor(baseColor, flashTimer);
  const topColor = getFlashColor(lerpColor(baseColor, "#ffffff", 0.2), flashTimer);

  const halfSize = size / 2;
  const topSize = size * 0.7;
  const halfTopSize = topSize / 2;

  // Base
  ctx.fillStyle = postColor;
  ctx.fillRect(centerX - halfSize, centerY - halfSize, size, size);

  // Top cap
  ctx.fillStyle = topColor;
  ctx.fillRect(centerX - halfTopSize, centerY - halfTopSize, topSize, topSize);
}

export function drawSquarePostShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  shadowOffset: number
) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(centerX - size / 2 - shadowOffset, centerY - size / 2 + shadowOffset, size, size);
}

