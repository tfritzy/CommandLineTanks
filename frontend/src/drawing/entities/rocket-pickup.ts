import { UNIT_TO_PIXEL } from "../../game";

export function drawRocketPickupShadow(
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

export function drawRocketPickupBody(
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

  const rocketWidth = size * 0.15;
  const rocketLength = size * 0.35;
  
  ctx.fillStyle = "#4e9363";
  ctx.beginPath();
  ctx.ellipse(0, 0, rocketLength, rocketWidth, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#3c6c54";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}
