import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS } from "../../theme/colors";

export function drawPenBorderBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const borderWidth = UNIT_TO_PIXEL * 0.12;
  const cornerRadius = UNIT_TO_PIXEL * 0.15;
  const rectWidth = width * UNIT_TO_PIXEL;
  const rectHeight = height * UNIT_TO_PIXEL;

  ctx.save();

  ctx.strokeStyle = COLORS.TERRAIN.BLACK_CHECKER;
  ctx.lineWidth = borderWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.roundRect(
    x + borderWidth / 2,
    y + borderWidth / 2,
    rectWidth - borderWidth,
    rectHeight - borderWidth,
    cornerRadius
  );
  ctx.stroke();

  ctx.restore();
}
