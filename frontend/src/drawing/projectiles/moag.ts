import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_LARGE } from "../../utils/neon";


export function drawMoagShadow(
  _ctx: CanvasRenderingContext2D,
  _centerX: number,
  _centerY: number,
  _size: number
) {
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

  ctx.save();

  setGlow(ctx, color, NEON_GLOW_BLUR_LARGE);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();
}
