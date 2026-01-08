import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";


export function drawBoomerangShadow(
  _ctx: CanvasRenderingContext2D,
  _centerX: number,
  _centerY: number,
  _armLength: number,
  _armWidth: number
) {
}

export function drawBoomerangBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  armLength: number,
  armWidth: number,
  color: string
) {
  ctx.save();
  ctx.translate(centerX, centerY);

  setGlow(ctx, color, NEON_GLOW_BLUR_MEDIUM);
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";

  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 3);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(armLength, -armWidth * 0.4);
    ctx.quadraticCurveTo(armLength * 1.1, 0, armLength, armWidth * 0.4);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, armWidth * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();
}
