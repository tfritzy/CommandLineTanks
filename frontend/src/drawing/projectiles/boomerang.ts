import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";


export function drawBoomerangShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  armLength: number,
  armWidth: number,
  color: string
) {
  ctx.save();
  ctx.translate(centerX - 3, centerY + 3);
  const shadowColor = getNeonShadowColor(color);
  ctx.fillStyle = shadowColor;

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

    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, armWidth * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
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

  const fillColor = getNeonFillColor(color);

  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 3);

    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(armLength, -armWidth * 0.4);
    ctx.quadraticCurveTo(armLength * 1.1, 0, armLength, armWidth * 0.4);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    setGlow(ctx, color, NEON_GLOW_BLUR_MEDIUM);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
    clearGlow(ctx);

    ctx.restore();
  }

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(0, 0, armWidth * 0.5, 0, Math.PI * 2);
  ctx.fill();

  setGlow(ctx, color, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();
}
