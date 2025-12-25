import { UNIT_TO_PIXEL } from "../../game";

export function drawTripleShooterPickupShadow(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;

  ctx.save();
  ctx.translate(worldX - 4, worldY + 4);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawTripleShooterPickupBody(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;

  ctx.save();
  ctx.translate(worldX, worldY);

  ctx.fillStyle = "#fceba8";
  ctx.strokeStyle = "#f5c47c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const bulletSize = size * 0.12;
  const spacing = size * 0.15;
  
  ctx.fillStyle = "#2e2e43";
  ctx.beginPath();
  ctx.arc(-spacing, 0, bulletSize, 0, Math.PI * 2);
  ctx.arc(0, -spacing * 0.5, bulletSize, 0, Math.PI * 2);
  ctx.arc(spacing, 0, bulletSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
