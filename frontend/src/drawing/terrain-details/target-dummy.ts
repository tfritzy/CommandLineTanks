import { UNIT_TO_PIXEL, TERRAIN_DETAIL_COLORS } from "../../constants";
import { getFlashColor } from "../../utils/colors";

export function drawTargetDummyShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number
) {
  const shadowOffset = UNIT_TO_PIXEL * 0.1;
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.arc(centerX - shadowOffset, centerY + shadowOffset, UNIT_TO_PIXEL * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTargetDummyBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  flashTimer: number
) {
  const bodyColor = getFlashColor(TERRAIN_DETAIL_COLORS.TARGET_DUMMY.BODY, flashTimer);
  const rimColor = getFlashColor(TERRAIN_DETAIL_COLORS.TARGET_DUMMY.RIM, flashTimer);
  const centerColor = getFlashColor(TERRAIN_DETAIL_COLORS.TARGET_DUMMY.CENTER, flashTimer);

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = rimColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = centerColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, UNIT_TO_PIXEL * 0.1, 0, Math.PI * 2);
  ctx.fill();
}
