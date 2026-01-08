import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";


export function drawNormalProjectileShadow(
  _ctx: CanvasRenderingContext2D,
  _centerX: number,
  _centerY: number,
  _radius: number
) {
}

export function drawNormalProjectileBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string
) {
  ctx.save();
  setGlow(ctx, color, NEON_GLOW_BLUR_MEDIUM);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  clearGlow(ctx);
  ctx.restore();
}
