import { UNIT_TO_PIXEL } from "../../constants";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";

const NEON_PURPLE = "#aa00ff";

export function drawUnknownPickupShadow(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;
  const shadowColor = getNeonShadowColor(NEON_PURPLE);

  ctx.save();
  ctx.translate(worldX - 4, worldY + 4);
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawUnknownPickupBody(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;
  const fillColor = getNeonFillColor(NEON_PURPLE);

  ctx.save();
  ctx.translate(worldX, worldY);

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();

  setGlow(ctx, NEON_PURPLE, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = NEON_PURPLE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = NEON_PURPLE;
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", 0, 0);
  clearGlow(ctx);

  ctx.restore();
}
