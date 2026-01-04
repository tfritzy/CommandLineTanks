import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS } from "../../theme/colors";

export function drawUnknownPickupShadow(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;

  ctx.save();
  ctx.translate(worldX - 4, worldY + 4);
  ctx.fillStyle = COLORS.GAME.SHADOW_LIGHT;
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

  ctx.save();
  ctx.translate(worldX, worldY);

  ctx.fillStyle = COLORS.TERMINAL.TEXT_MUTED;
  ctx.strokeStyle = COLORS.TERMINAL.TEXT_DIM;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.UI.TEXT_PRIMARY;
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", 0, 0);

  ctx.restore();
}
