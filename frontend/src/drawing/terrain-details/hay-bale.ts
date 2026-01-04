import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";

export function drawHayBaleShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(centerX - UNIT_TO_PIXEL * 0.15, centerY + UNIT_TO_PIXEL * 0.15, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHayBaleBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  ctx.fillStyle = getFlashColor(COLORS.TERRAIN.HAY_BALE_BODY, flashTimer);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = getFlashColor(COLORS.TERRAIN.HAY_BALE_RING, flashTimer);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
  ctx.stroke();
}
