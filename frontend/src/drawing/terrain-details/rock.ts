import { getFlashColor } from "../../utils/colors";

export function drawRockShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const shadowOffset = radius * 0.2;
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";

  ctx.beginPath();
  ctx.arc(centerX - shadowOffset, centerY + shadowOffset, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRockBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const bodyColor = getFlashColor("#4a4b5b", flashTimer);
  const shadowColor = getFlashColor("#3e3f4d", flashTimer);
  const highlightColor = getFlashColor("#565769", flashTimer);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = bodyColor;
  ctx.fill();

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.15, centerY + radius * 0.15, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.arc(centerX + radius * 0.15, centerY - radius * 0.15, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = getFlashColor("#2e2e43", flashTimer);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
}
