import { UNIT_TO_PIXEL } from "../../constants";
import { PALETTE } from "../../theme/colors.config";

export function drawPenBorderBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const borderWidth = UNIT_TO_PIXEL * 0.07;
  const rectWidth = width * UNIT_TO_PIXEL;
  const rectHeight = height * UNIT_TO_PIXEL;

  ctx.save();

  ctx.strokeStyle = PALETTE.BLUE_INFO;
  ctx.lineWidth = borderWidth;

  ctx.beginPath();
  ctx.rect(
    x + borderWidth / 2,
    y + borderWidth / 2,
    rectWidth - borderWidth,
    rectHeight - borderWidth,
  );
  ctx.stroke();

  ctx.restore();
}
