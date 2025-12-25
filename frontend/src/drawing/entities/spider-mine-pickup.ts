import { UNIT_TO_PIXEL } from "../../game";

export function drawSpiderMinePickupShadow(
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

export function drawSpiderMinePickupBody(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;

  ctx.save();
  ctx.translate(worldX, worldY);

  ctx.fillStyle = "#5b3a56";
  ctx.strokeStyle = "#4f2d4d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const mineRadius = size * 0.15;
  const legLength = size * 0.2;
  
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const legX = Math.cos(angle) * legLength;
    const legY = Math.sin(angle) * legLength;
    const startX = Math.cos(angle) * mineRadius;
    const startY = Math.sin(angle) * mineRadius;
    
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#2a152d";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(legX, legY);
    ctx.stroke();
  }

  ctx.fillStyle = "#4f2d4d";
  ctx.beginPath();
  ctx.arc(0, 0, mineRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2a152d";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#c06852";
  const eyeRadius = 1.5;
  const eyeOffset = mineRadius * 0.4;
  ctx.beginPath();
  ctx.arc(-eyeOffset, -eyeOffset * 0.3, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffset, -eyeOffset * 0.3, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
