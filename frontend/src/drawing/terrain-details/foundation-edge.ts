import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";

export function drawFoundationEdgeShadow(
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
  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.3);
  ctx.restore();
}

export function drawFoundationEdgeBody(
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

  const baseColor = getFlashColor(COLORS.TERRAIN.FOUNDATION_BASE, flashTimer);

  ctx.fillStyle = baseColor;
  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.3);

  ctx.restore();
}
