import { TERRAIN_COLORS, UI_COLORS } from "../../constants";

export function drawSniperProjectileShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  bulletLength: number,
  bulletWidth: number,
  bulletBackRatio: number,
  angle: number
) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  // Bullet tip (ogive shape)
  ctx.moveTo(bulletLength, 0);
  ctx.bezierCurveTo(
    bulletLength * 0.8, -bulletWidth * 0.2,
    bulletLength * 0.4, -bulletWidth,
    0, -bulletWidth
  );
  // Body
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

  // Draw the casing (back part)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -bulletWidth);
  ctx.lineTo(-bulletLength * bulletBackRatio, -bulletWidth);
  // Small rim at the back
  ctx.lineTo(-bulletLength * bulletBackRatio, -bulletWidth * 1.1);
  ctx.lineTo(-bulletLength * (bulletBackRatio + 0.05), -bulletWidth * 1.1);
  ctx.lineTo(-bulletLength * (bulletBackRatio + 0.05), bulletWidth * 1.1);
  ctx.lineTo(-bulletLength * bulletBackRatio, bulletWidth * 1.1);
  ctx.lineTo(-bulletLength * bulletBackRatio, bulletWidth);
  ctx.lineTo(0, bulletWidth);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = TERRAIN_COLORS.GROUND;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw the bullet (front part)
  ctx.fillStyle = color;
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

  ctx.strokeStyle = TERRAIN_COLORS.GROUND;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Add a highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bulletLength * 0.8, -bulletWidth * 0.3);
  ctx.bezierCurveTo(
    bulletLength * 0.6, -bulletWidth * 0.5,
    bulletLength * 0.2, -bulletWidth * 0.7,
    -bulletLength * bulletBackRatio * 0.5, -bulletWidth * 0.7
  );
  ctx.stroke();

  ctx.restore();
}
