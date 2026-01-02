import { UNIT_TO_PIXEL, TERRAIN_DETAIL_COLORS } from "../../constants";
import { getFlashColor, lerpColor } from "../../utils/colors";
import { drawSquarePost, drawSquarePostShadow } from "./fence-utils";

export function drawFenceEdgeShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number
) {
  const shadowOffset = UNIT_TO_PIXEL * 0.10;
  const angle = (rotation * 90 * Math.PI) / 180;

  // Post shadow
  const size = UNIT_TO_PIXEL * 0.22;
  drawSquarePostShadow(ctx, centerX, centerY, size, shadowOffset);

  // Rail and slats shadow
  ctx.save();
  ctx.translate(-shadowOffset, shadowOffset);
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.translate(-centerX, -centerY);

  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  const railWidth = UNIT_TO_PIXEL * 0.05;
  const slatWidth = UNIT_TO_PIXEL * 0.22;
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const totalHeight = railWidth + slatHeight;
  const slatY = y - totalHeight / 2;
  const railY = slatY + slatHeight;

  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, railY, UNIT_TO_PIXEL, railWidth);

  const postSize = UNIT_TO_PIXEL * 0.22;
  const snugOffset = (postSize / 2 + slatWidth / 2) / UNIT_TO_PIXEL;

  // Boundary slats (half-width to stay within tile)
  // Left boundary
  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, slatY, slatWidth / 2, slatHeight);
  // Right boundary
  ctx.fillRect(x + UNIT_TO_PIXEL * 0.5 - slatWidth / 2, slatY, slatWidth / 2, slatHeight);

  // Inner slats (full width)
  const innerOffsets = [-snugOffset, snugOffset];
  for (const off of innerOffsets) {
    ctx.fillRect(x + off * UNIT_TO_PIXEL - slatWidth / 2, slatY, slatWidth, slatHeight);
  }
  ctx.restore();
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
  const postColor = getFlashColor(TERRAIN_DETAIL_COLORS.FENCE.POST, flashTimer);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.translate(-centerX, -centerY);

  const railWidth = UNIT_TO_PIXEL * 0.05;
  const slatWidth = UNIT_TO_PIXEL * 0.22;
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const totalHeight = railWidth + slatHeight;
  const slatY = y - totalHeight / 2;
  const railY = slatY + slatHeight;

  ctx.fillStyle = postColor;
  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, railY, UNIT_TO_PIXEL, railWidth);

  const postSize = UNIT_TO_PIXEL * 0.22;
  const snugOffset = (postSize / 2 + slatWidth / 2) / UNIT_TO_PIXEL;
  const slatColor = getFlashColor(
    lerpColor(TERRAIN_DETAIL_COLORS.FENCE.POST, "#ffffff", 0.15),
    flashTimer
  );
  ctx.fillStyle = slatColor;

  // Boundary slats (half-width to stay within tile)
  // Left boundary
  ctx.fillRect(x - UNIT_TO_PIXEL * 0.5, slatY, slatWidth / 2, slatHeight);
  // Right boundary
  ctx.fillRect(x + UNIT_TO_PIXEL * 0.5 - slatWidth / 2, slatY, slatWidth / 2, slatHeight);

  // Inner slats (full width)
  const innerOffsets = [-snugOffset, snugOffset];
  for (const off of innerOffsets) {
    ctx.fillRect(x + off * UNIT_TO_PIXEL - slatWidth / 2, slatY, slatWidth, slatHeight);
  }
  ctx.restore();

  // Big post in center (unrotated for consistent shading)
  const size = UNIT_TO_PIXEL * 0.22;
  drawSquarePost(ctx, centerX, centerY, size, TERRAIN_DETAIL_COLORS.FENCE.POST, flashTimer);
}
