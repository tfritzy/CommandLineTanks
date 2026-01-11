import { UNIT_TO_PIXEL } from "../../constants";
import { COLORS } from "../../theme/colors";

const LABEL_COLOR = COLORS.UI.LABEL_YELLOW;

export function drawFloatingLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  alpha: number
) {
  const savedAlpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha;
  ctx.font = "12px monospace";
  ctx.fillStyle = LABEL_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x * UNIT_TO_PIXEL, y * UNIT_TO_PIXEL);
  ctx.globalAlpha = savedAlpha;
}
