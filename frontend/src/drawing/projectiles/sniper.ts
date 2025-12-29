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
  ctx.moveTo(bulletLength, 0);
  ctx.lineTo(0, -bulletWidth);
  ctx.lineTo(-bulletLength * bulletBackRatio, -bulletWidth);
  ctx.lineTo(-bulletLength * bulletBackRatio, bulletWidth);
  ctx.lineTo(0, bulletWidth);
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

  ctx.fillStyle = "#a9bcbf";
  ctx.beginPath();
  ctx.moveTo(bulletLength, 0);
  ctx.lineTo(0, -bulletWidth);
  ctx.lineTo(-bulletLength * bulletBackRatio, -bulletWidth);
  ctx.lineTo(-bulletLength * bulletBackRatio, bulletWidth);
  ctx.lineTo(0, bulletWidth);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -bulletWidth);
  ctx.lineTo(-bulletLength * bulletBackRatio, -bulletWidth);
  ctx.lineTo(-bulletLength * bulletBackRatio, bulletWidth);
  ctx.lineTo(0, bulletWidth);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#2e2e43";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
