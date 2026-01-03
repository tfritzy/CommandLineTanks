import { UNIT_TO_PIXEL, TERRAIN_DETAIL_COLORS } from "../../constants";

const LABEL_COLOR = TERRAIN_DETAIL_COLORS.HAY_BALE.BODY;

export function drawFloatingLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  alpha: number
) {
  ctx.save();
  ctx.translate(x * UNIT_TO_PIXEL, y * UNIT_TO_PIXEL);
  ctx.globalAlpha = alpha;
  ctx.font = "12px monospace";
  ctx.fillStyle = LABEL_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
