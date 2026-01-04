import { getFlashColor, lerpColor } from "../../utils/colors";
import { PALETTE } from "../../theme/colors";

export function drawSquarePost(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  baseColor: string,
  flashTimer: number
) {
  const postColor = getFlashColor(baseColor, flashTimer);
  const darkColor = getFlashColor(lerpColor(baseColor, "#000000", 0.15), flashTimer);
  const lightColor = getFlashColor(lerpColor(baseColor, "#ffffff", 0.15), flashTimer);
  const topColor = getFlashColor(lerpColor(baseColor, "#ffffff", 0.3), flashTimer);

  const halfSize = size / 2;
  const innerSize = size * 0.4;
  const halfInnerSize = innerSize / 2;

  // Base square
  ctx.fillStyle = postColor;
  ctx.fillRect(centerX - halfSize, centerY - halfSize, size, size);

  // Top face (highlighted)
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.moveTo(centerX - halfSize, centerY - halfSize);
  ctx.lineTo(centerX + halfSize, centerY - halfSize);
  ctx.lineTo(centerX + halfInnerSize, centerY - halfInnerSize);
  ctx.lineTo(centerX - halfInnerSize, centerY - halfInnerSize);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX - halfSize, centerY - halfSize);
  ctx.lineTo(centerX - halfInnerSize, centerY - halfInnerSize);
  ctx.lineTo(centerX - halfInnerSize, centerY + halfInnerSize);
  ctx.lineTo(centerX - halfSize, centerY + halfSize);
  ctx.fill();

  // Bottom/Right faces (shaded)
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.moveTo(centerX + halfSize, centerY - halfSize);
  ctx.lineTo(centerX + halfSize, centerY + halfSize);
  ctx.lineTo(centerX + halfInnerSize, centerY + halfInnerSize);
  ctx.lineTo(centerX + halfInnerSize, centerY - halfInnerSize);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerX - halfSize, centerY + halfSize);
  ctx.lineTo(centerX + halfSize, centerY + halfSize);
  ctx.lineTo(centerX + halfInnerSize, centerY + halfInnerSize);
  ctx.lineTo(centerX - halfInnerSize, centerY + halfInnerSize);
  ctx.fill();

  // Center top square
  ctx.fillStyle = topColor;
  ctx.fillRect(centerX - halfInnerSize, centerY - halfInnerSize, innerSize, innerSize);
}

export function drawSquarePostShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  shadowOffset: number
) {
  ctx.fillStyle = PALETTE.BLACK_PURE + "40";
  ctx.fillRect(centerX - size / 2 - shadowOffset, centerY - size / 2 + shadowOffset, size, size);
}

