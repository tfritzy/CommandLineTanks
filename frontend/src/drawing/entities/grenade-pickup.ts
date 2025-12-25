import { UNIT_TO_PIXEL } from "../../game";

export function drawGrenadePickupShadow(
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

export function drawGrenadePickupBody(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;

  ctx.save();
  ctx.translate(worldX, worldY);

  ctx.fillStyle = "#6ec077";
  ctx.strokeStyle = "#4e9363";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const grenadeRadius = size * 0.2;
  ctx.fillStyle = "#4e9363";
  ctx.strokeStyle = "#3c6c54";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, grenadeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#2e2e43";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-grenadeRadius, 0);
  ctx.lineTo(grenadeRadius, 0);
  ctx.stroke();

  const pinWidth = grenadeRadius * 0.4;
  const pinHeight = grenadeRadius * 0.6;
  const pinY = -grenadeRadius * 1.3;
  
  ctx.fillStyle = "#2e2e43";
  ctx.fillRect(-pinWidth / 2, pinY - pinHeight, pinWidth, pinHeight);

  ctx.restore();
}
