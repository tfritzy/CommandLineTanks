import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { COLORS, PALETTE } from "../../theme/colors";

export function drawTargetDummyShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number
) {
  const shadowOffset = UNIT_TO_PIXEL * 0.1;
  ctx.fillStyle = PALETTE.BLACK_PURE + "59";
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
  const bodyColor = getFlashColor(COLORS.TERRAIN.TARGET_DUMMY_BODY, flashTimer);
  const rimColor = getFlashColor(COLORS.TERRAIN.TARGET_DUMMY_RIM, flashTimer);
  const centerColor = getFlashColor(COLORS.TERRAIN.TARGET_DUMMY_CENTER, flashTimer);

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
