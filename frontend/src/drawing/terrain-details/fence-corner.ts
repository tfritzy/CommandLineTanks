import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { drawSquarePost } from "./fence-utils";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";

export function drawFenceCornerShadow(
  _ctx: CanvasRenderingContext2D,
  _x: number,
  _y: number,
  _centerX: number,
  _centerY: number,
  _rotation: number
) {
}

export function drawFenceCornerBody(
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
  const totalHeight = railWidth + slatHeight;

  const hSlatY = y - totalHeight / 2;
  const vSlatX = x - totalHeight / 2;

  setGlow(ctx, postColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = postColor;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.rect(vSlatX, hSlatY, UNIT_TO_PIXEL * 0.5 + (x - vSlatX), totalHeight);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(vSlatX, hSlatY, totalHeight, UNIT_TO_PIXEL * 0.5 + (y - hSlatY));
  ctx.stroke();
  clearGlow(ctx);

  ctx.restore();

  const size = UNIT_TO_PIXEL * 0.22;
  drawSquarePost(ctx, centerX, centerY, size, COLORS.TERRAIN.FENCE_POST, flashTimer);
}
