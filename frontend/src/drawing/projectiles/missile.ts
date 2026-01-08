import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";


export function drawMissileShadow(
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
  ctx.translate(-3, 3);
  
  const shadowColor = getNeonShadowColor(color);
  ctx.fillStyle = shadowColor;
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
  setGlow(ctx, COLORS.EFFECTS.FIRE_YELLOW, NEON_GLOW_BLUR_MEDIUM);
  ctx.fillStyle = COLORS.EFFECTS.FIRE_YELLOW;
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.3);
  ctx.lineTo(-flameLength, 0);
  ctx.lineTo(0, radius * 0.3);
  ctx.fill();
  clearGlow(ctx);

  const fillColor = getNeonFillColor(color);
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(radius * 2, 0);
  ctx.lineTo(0, -radius * 0.8);
  ctx.lineTo(0, radius * 0.8);
  ctx.closePath();
  ctx.fill();

  setGlow(ctx, color, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  clearGlow(ctx);
  
  ctx.restore();
}
