import { UNIT_TO_PIXEL } from "../../game";

export function drawMissileLauncherPickupShadow(
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

export function drawMissileLauncherPickupBody(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;

  ctx.save();
  ctx.translate(worldX, worldY);

  ctx.fillStyle = "#c06852";
  ctx.strokeStyle = "#9d4343";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const missileSize = size * 0.25;
  ctx.fillStyle = "#9d4343";
  ctx.beginPath();
  ctx.moveTo(missileSize, 0);
  ctx.lineTo(-missileSize * 0.3, -missileSize * 0.5);
  ctx.lineTo(-missileSize * 0.3, missileSize * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#813645";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}
