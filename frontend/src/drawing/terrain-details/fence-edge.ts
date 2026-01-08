import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { drawSquarePost } from "./fence-utils";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";

export function drawFenceEdgeShadow(
  _ctx: CanvasRenderingContext2D,
  _x: number,
  _y: number,
  _centerX: number,
  _centerY: number,
  _rotation: number
) {
}

export function drawFenceEdgeBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number,
  flashTimer: number
) {
  const angle = (rotation * 90 * Math.PI) / 180;
  const postColor = getFlashColor(COLORS.TERRAIN.FENCE_POST, flashTimer);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.translate(-centerX, -centerY);

  const railWidth = UNIT_TO_PIXEL * 0.05;
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const barWidth = railWidth + slatHeight;
  const barY = y - barWidth / 2;

  setGlow(ctx, postColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = postColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x - UNIT_TO_PIXEL * 0.5, barY, UNIT_TO_PIXEL, barWidth);
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();

  const size = UNIT_TO_PIXEL * 0.22;
  drawSquarePost(ctx, centerX, centerY, size, COLORS.TERRAIN.FENCE_POST, flashTimer);
}
