import { COLORS } from "../../theme/colors";


export function drawMissileShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
) {
  ctx.save();
  
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  
  ctx.fillStyle = COLORS.GAME.SHADOW_LIGHT;
  ctx.beginPath();
  ctx.moveTo(radius * 2, 0);
  ctx.lineTo(0, -radius * 0.8);
  ctx.lineTo(0, radius * 0.8);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

export function drawMissileBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
  color: string
) {
  ctx.save();
  
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  
  const flameLength = radius * 1 + .5;
  ctx.fillStyle = COLORS.EFFECTS.FIRE_YELLOW;
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.3);
  ctx.lineTo(-flameLength, 0);
  ctx.lineTo(0, radius * 0.3);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(radius * 2, 0);
  ctx.lineTo(0, -radius * 0.8);
  ctx.lineTo(0, radius * 0.8);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}
