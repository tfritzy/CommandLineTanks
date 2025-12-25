import { UNIT_TO_PIXEL } from "../../game";

export function drawBoomerangPickupShadow(
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

export function drawBoomerangPickupBody(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;

  ctx.save();
  ctx.translate(worldX, worldY);

  ctx.fillStyle = "#7fbbdc";
  ctx.strokeStyle = "#5a78b2";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const boomerangSize = size * 0.3;
  ctx.strokeStyle = "#495f94";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  
  ctx.beginPath();
  ctx.arc(0, 0, boomerangSize, Math.PI * 0.2, Math.PI * 0.7, false);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(0, 0, boomerangSize, Math.PI * 1.2, Math.PI * 1.7, false);
  ctx.stroke();

  ctx.restore();
}
