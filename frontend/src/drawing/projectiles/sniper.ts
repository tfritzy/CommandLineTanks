import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";


export function drawSniperProjectileShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bulletLength: number,
  bulletWidth: number,
  bulletBackRatio: number,
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
  ctx.moveTo(bulletLength, 0);
  ctx.bezierCurveTo(
    bulletLength * 0.8, -bulletWidth * 0.2,
    bulletLength * 0.4, -bulletWidth,
    0, -bulletWidth
  );
  ctx.lineTo(-bulletLength * bulletBackRatio, -bulletWidth);
  ctx.lineTo(-bulletLength * bulletBackRatio, bulletWidth);
  ctx.lineTo(0, bulletWidth);
  ctx.bezierCurveTo(
    bulletLength * 0.4, bulletWidth,
    bulletLength * 0.8, bulletWidth * 0.2,
    bulletLength, 0
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawSniperProjectileBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bulletLength: number,
  bulletWidth: number,
  bulletBackRatio: number,
  angle: number,
  color: string
) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  const fillColor = getNeonFillColor(color);

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(0, -bulletWidth);
  ctx.lineTo(-bulletLength * bulletBackRatio, -bulletWidth);
  ctx.lineTo(-bulletLength * bulletBackRatio, -bulletWidth * 1.1);
  ctx.lineTo(-bulletLength * (bulletBackRatio + 0.05), -bulletWidth * 1.1);
  ctx.lineTo(-bulletLength * (bulletBackRatio + 0.05), bulletWidth * 1.1);
  ctx.lineTo(-bulletLength * bulletBackRatio, bulletWidth * 1.1);
  ctx.lineTo(-bulletLength * bulletBackRatio, bulletWidth);
  ctx.lineTo(0, bulletWidth);
  ctx.closePath();
  ctx.fill();

  setGlow(ctx, color, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(bulletLength, 0);
  ctx.bezierCurveTo(
    bulletLength * 0.8, -bulletWidth * 0.2,
    bulletLength * 0.4, -bulletWidth,
    0, -bulletWidth
  );
  ctx.lineTo(0, bulletWidth);
  ctx.bezierCurveTo(
    bulletLength * 0.4, bulletWidth,
    bulletLength * 0.8, bulletWidth * 0.2,
    bulletLength, 0
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();
}
