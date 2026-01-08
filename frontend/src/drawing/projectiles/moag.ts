import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_LARGE, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";


export function drawMoagShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  alliance: number
) {
  const radius = size * UNIT_TO_PIXEL;
  const color = alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT : COLORS.GAME.TEAM_BLUE_BRIGHT;
  const shadowColor = getNeonShadowColor(color);

  ctx.save();
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(centerX - 4, centerY + 4, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawMoagBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  alliance: number
) {
  const radius = size * UNIT_TO_PIXEL;
  const color = alliance === 0 ? COLORS.GAME.TEAM_RED_BRIGHT : COLORS.GAME.TEAM_BLUE_BRIGHT;
  const fillColor = getNeonFillColor(color);

  ctx.save();

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  setGlow(ctx, color, NEON_GLOW_BLUR_LARGE);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();
}
