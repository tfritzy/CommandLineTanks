import { UNIT_TO_PIXEL } from "../../constants";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";

export function drawUnknownPickupShadow(
  _ctx: CanvasRenderingContext2D,
  _positionX: number,
  _positionY: number
) {
}

const NEON_PURPLE = "#aa00ff";

export function drawUnknownPickupBody(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;

  ctx.save();
  ctx.translate(worldX, worldY);

  ctx.fillStyle = "#000000";
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
