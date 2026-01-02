import { DECORATION_COLORS } from "../../constants";

export function drawMushroom(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  rotation: number,
  seed: number
) {
  const colors = DECORATION_COLORS.MUSHROOM;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);

  const stemWidth = size * 0.3;
  const stemHeight = size * 0.5;
  const capRadius = size * 0.5;

  ctx.fillStyle = colors.STEM;
  ctx.fillRect(-stemWidth / 2, -stemHeight / 2, stemWidth, stemHeight);

  ctx.fillStyle = colors.CAP;
  ctx.beginPath();
  ctx.ellipse(0, -stemHeight / 2, capRadius, capRadius * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  const pseudoRandom = Math.abs(Math.sin(seed * 12345.6789) * 10000) % 1;
  const spotCount = 2 + Math.floor(pseudoRandom * 2);
  ctx.fillStyle = colors.SPOT;
  for (let i = 0; i < spotCount; i++) {
    const angle = (i / spotCount) * Math.PI * 2;
    const spotDistance = capRadius * 0.4;
    const spotX = Math.cos(angle) * spotDistance;
    const spotY = -stemHeight / 2 + Math.sin(angle) * spotDistance * 0.6;
    const spotSize = capRadius * 0.2;
    
    ctx.beginPath();
    ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
