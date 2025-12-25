import { UNIT_TO_PIXEL } from "../../game";
import { TEAM_COLORS } from "../../constants";

export function drawProjectileShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  
  const centerX = x * UNIT_TO_PIXEL;
  const centerY = y * UNIT_TO_PIXEL;
  const radius = size * UNIT_TO_PIXEL;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX - 4, centerY + 4, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

export function drawProjectileBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alliance: number
) {
  ctx.save();
  
  const centerX = x * UNIT_TO_PIXEL;
  const centerY = y * UNIT_TO_PIXEL;
  const radius = size * UNIT_TO_PIXEL;
  
  ctx.fillStyle = alliance === 0 ? TEAM_COLORS.RED : TEAM_COLORS.BLUE;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.restore();
}
