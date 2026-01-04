import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS, PALETTE } from "../../theme/colors";

export function drawHealthPackShadow(
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number
) {
  const worldX = positionX * UNIT_TO_PIXEL;
  const worldY = positionY * UNIT_TO_PIXEL;
  const size = UNIT_TO_PIXEL * 0.6;

  ctx.save();
  ctx.translate(worldX - 4, worldY + 4);
  ctx.fillStyle = PALETTE.BLACK_PURE + "4d";
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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

  ctx.fillStyle = COLORS.TERMINAL.SUCCESS;
  ctx.strokeStyle = COLORS.GAME.HEALTH_PACK_SECONDARY;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = COLORS.UI.TEXT_PRIMARY;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const crossSize = size * 0.4;
  ctx.beginPath();
  ctx.moveTo(0, -crossSize / 2);
  ctx.lineTo(0, crossSize / 2);
  ctx.moveTo(-crossSize / 2, 0);
  ctx.lineTo(crossSize / 2, 0);
  ctx.stroke();

  ctx.restore();
}
