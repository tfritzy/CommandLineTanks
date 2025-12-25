import { UNIT_TO_PIXEL } from "../../game";
import { getFlashColor } from "../../utils/colors";

export function drawFoundationCornerShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number
) {
  ctx.save();

  const shadowOffset = UNIT_TO_PIXEL * 0.08;

  ctx.translate(centerX - shadowOffset, centerY + shadowOffset);
  ctx.rotate((rotation * 90 * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.moveTo(x - UNIT_TO_PIXEL * 0.15, y - UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y + UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.5);
  ctx.lineTo(x - UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawFoundationCornerBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number,
  flashTimer: number
) {
  ctx.save();

  ctx.translate(centerX, centerY);
  ctx.rotate((rotation * 90 * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  const baseColor = getFlashColor("#707b89", flashTimer);

  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(x - UNIT_TO_PIXEL * 0.15, y - UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.5, y + UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.15);
  ctx.lineTo(x + UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.5);
  ctx.lineTo(x - UNIT_TO_PIXEL * 0.15, y + UNIT_TO_PIXEL * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
