import { getFlashColor } from "../../utils/colors";

export function drawTreeShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const shadowOffsetX = -radius * 0.4;
  const shadowOffsetY = radius * 0.4;
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(centerX + shadowOffsetX, centerY + shadowOffsetY, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTreeBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = getFlashColor("#3e4c7e", flashTimer);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = getFlashColor("#495f94", flashTimer);
  ctx.beginPath();
  const dividerCenterX = centerX + radius * 0.4;
  const dividerCenterY = centerY - radius * 0.4;
  const dividerRadius = radius * 1.3;
  ctx.arc(dividerCenterX, dividerCenterY, dividerRadius, 0, Math.PI * 2);
  ctx.fill();
}
