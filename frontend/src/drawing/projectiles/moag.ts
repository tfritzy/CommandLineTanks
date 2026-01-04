import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS, PALETTE } from "../../theme/colors";


export function drawMoagShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number
) {
  const radius = size * UNIT_TO_PIXEL;

  ctx.save();
  ctx.fillStyle = PALETTE.BLACK_PURE + "4d";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
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

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLORS.UI.BLACK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
