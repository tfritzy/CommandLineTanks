import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";


export function drawSniperProjectileShadow(
  _ctx: CanvasRenderingContext2D,
  _centerX: number,
  _centerY: number,
  _bulletLength: number,
  _bulletWidth: number,
  _bulletBackRatio: number,
  _angle: number
) {
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

  setGlow(ctx, color, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

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
  ctx.stroke();

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
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();
}
