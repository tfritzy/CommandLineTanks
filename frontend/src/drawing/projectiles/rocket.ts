import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";


export function drawRocketShadow(
  _ctx: CanvasRenderingContext2D,
  _centerX: number,
  _centerY: number,
  _radius: number,
  _angle: number
) {
}

export function drawRocketBody(
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
  
  const flameLength = radius * 2;
  setGlow(ctx, COLORS.EFFECTS.FIRE_YELLOW, NEON_GLOW_BLUR_MEDIUM);
  ctx.fillStyle = COLORS.EFFECTS.FIRE_YELLOW;
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.4);
  ctx.lineTo(-flameLength, 0);
  ctx.lineTo(0, radius * 0.4);
  ctx.fill();
  clearGlow(ctx);

  setGlow(ctx, color, NEON_GLOW_BLUR_MEDIUM);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 3, radius * 1.2, 0, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(0, radius * 1.2);
  ctx.lineTo(0, -radius * 1.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  clearGlow(ctx);
  
  ctx.restore();
}
