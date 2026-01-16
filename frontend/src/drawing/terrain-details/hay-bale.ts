import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";

export function drawHayBaleShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const width = radius * 2.4;
  const height = radius * 1.8;
  const cornerRadius = 4;
  const shadowOffset = UNIT_TO_PIXEL * 0.1;

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.roundRect(
    centerX - width / 2 - shadowOffset,
    centerY - height / 2 + shadowOffset,
    width,
    height,
    cornerRadius
  );
  ctx.fill();
}

export function drawHayBaleBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const width = radius * 2.4;
  const height = radius * 1.8;
  const cornerRadius = 4;

  // Body
  ctx.fillStyle = getFlashColor(COLORS.TERRAIN.HAY_BALE_BODY, flashTimer);
  ctx.beginPath();
  ctx.roundRect(centerX - width / 2, centerY - height / 2, width, height, cornerRadius);
  ctx.fill();

  // Highlight on top
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.beginPath();
  ctx.roundRect(centerX - width / 2, centerY - height / 2, width, height * 0.4, cornerRadius);
  ctx.fill();

  // Straps/Bands
  ctx.strokeStyle = getFlashColor(COLORS.TERRAIN.HAY_BALE_RING, flashTimer);
  ctx.lineWidth = 2;
  
  // Left band
  ctx.beginPath();
  ctx.moveTo(centerX - width * 0.25, centerY - height / 2);
  ctx.lineTo(centerX - width * 0.25, centerY + height / 2);
  ctx.stroke();

  // Right band
  ctx.beginPath();
  ctx.moveTo(centerX + width * 0.25, centerY - height / 2);
  ctx.lineTo(centerX + width * 0.25, centerY + height / 2);
  ctx.stroke();
}
