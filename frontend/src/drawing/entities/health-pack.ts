import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";

export function drawHealthPackShadow(
  _ctx: CanvasRenderingContext2D,
  _positionX: number,
  _positionY: number
) {
}

export function drawHealthPackBody(
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

  setGlow(ctx, COLORS.TERMINAL.SUCCESS, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = COLORS.TERMINAL.SUCCESS;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = COLORS.TERMINAL.SUCCESS;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const crossSize = size * 0.4;
  ctx.beginPath();
  ctx.moveTo(0, -crossSize / 2);
  ctx.lineTo(0, crossSize / 2);
  ctx.moveTo(-crossSize / 2, 0);
  ctx.lineTo(crossSize / 2, 0);
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();
}
