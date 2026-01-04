import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";


export function drawRockShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const shadowOffset = radius * 0.2;
  ctx.fillStyle = COLORS.GAME.SHADOW_LIGHT;

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
  const bodyColor = getFlashColor(COLORS.TERRAIN.ROCK_BODY, flashTimer);
  const shadowColor = getFlashColor(COLORS.TERRAIN.ROCK_SHADOW, flashTimer);
  const highlightColor = getFlashColor(COLORS.TERRAIN.ROCK_HIGHLIGHT, flashTimer);

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

  ctx.strokeStyle = getFlashColor(COLORS.TERRAIN.ROCK_OUTLINE, flashTimer);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
}
