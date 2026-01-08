import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";


export function drawGrenadeShadow(
  _ctx: CanvasRenderingContext2D,
  _centerX: number,
  _centerY: number,
  _radius: number
) {
}

export function drawGrenadeBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string
) {
  ctx.save();

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  setGlow(ctx, color, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, radius * 0.15);
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radius, radius * 1.1, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX - radius, centerY);
  ctx.lineTo(centerX + radius, centerY);
  ctx.stroke();

  const pinWidth = radius * 0.3;
  const pinHeight = radius * 0.4;
  const pinY = centerY - radius * 1.1;

  ctx.strokeRect(centerX - pinWidth / 2, pinY - pinHeight, pinWidth, pinHeight);

  const ringRadius = radius * 0.25;
  ctx.beginPath();
  ctx.arc(centerX + pinWidth / 2, pinY - pinHeight / 2, ringRadius, 0, Math.PI * 2);
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();
}
