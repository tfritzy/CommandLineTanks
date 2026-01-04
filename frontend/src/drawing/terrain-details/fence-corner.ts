import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor, lerpColor } from "../../utils/colors";
import { drawSquarePost, drawSquarePostShadow } from "./fence-utils";
import { COLORS } from "../../theme/colors";

export function drawFenceCornerShadow(
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
  const postSize = UNIT_TO_PIXEL * 0.22;

  const hSlatY = y - totalHeight / 2;
  const vSlatX = x - totalHeight / 2;
  const hRailY = hSlatY + slatHeight;
  const vRailX = vSlatX + slatHeight;

  // Horizontal rail shadow
  ctx.fillRect(vRailX, hRailY, UNIT_TO_PIXEL * 0.5 + (x - vRailX), railWidth);
  // Vertical rail shadow
  ctx.fillRect(vRailX, hRailY, railWidth, UNIT_TO_PIXEL * 0.5 + (y - hRailY));

  // Slats shadows
  const snugOffset = (postSize / 2 + slatWidth / 2) / UNIT_TO_PIXEL;
  const dSnug = snugOffset * UNIT_TO_PIXEL;

  // Snug slats
  ctx.fillRect(x + dSnug - slatWidth / 2, hSlatY, slatWidth, slatHeight);
  ctx.fillRect(vSlatX, y + dSnug - slatWidth / 2, slatHeight, slatWidth);

  // Boundary slats (half-width)
  ctx.fillRect(x + 0.5 * UNIT_TO_PIXEL - slatWidth / 2, hSlatY, slatWidth / 2, slatHeight);
  ctx.fillRect(vSlatX, y + 0.5 * UNIT_TO_PIXEL - slatWidth / 2, slatHeight, slatWidth / 2);

  ctx.restore();
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
  const slatWidth = UNIT_TO_PIXEL * 0.22;
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const totalHeight = railWidth + slatHeight;
  const postSize = UNIT_TO_PIXEL * 0.22;

  ctx.fillStyle = postColor;
  const hSlatY = y - totalHeight / 2;
  const vSlatX = x - totalHeight / 2;
  const hRailY = hSlatY + slatHeight;
  const vRailX = vSlatX + slatHeight;

  // Horizontal rail
  ctx.fillRect(vRailX, hRailY, UNIT_TO_PIXEL * 0.5 + (x - vRailX), railWidth);
  // Vertical rail
  ctx.fillRect(vRailX, hRailY, railWidth, UNIT_TO_PIXEL * 0.5 + (y - hRailY));

  const slatColor = getFlashColor(
    lerpColor(COLORS.TERRAIN.FENCE_POST, "#ffffff", 0.15),
    flashTimer
  );
  ctx.fillStyle = slatColor;
  // Slats
  const snugOffset = (postSize / 2 + slatWidth / 2) / UNIT_TO_PIXEL;
  const dSnug = snugOffset * UNIT_TO_PIXEL;

  // Snug slats
  ctx.fillRect(x + dSnug - slatWidth / 2, hSlatY, slatWidth, slatHeight);
  ctx.fillRect(vSlatX, y + dSnug - slatWidth / 2, slatHeight, slatWidth);

  // Boundary slats (half-width)
  ctx.fillRect(x + 0.5 * UNIT_TO_PIXEL - slatWidth / 2, hSlatY, slatWidth / 2, slatHeight);
  ctx.fillRect(vSlatX, y + 0.5 * UNIT_TO_PIXEL - slatWidth / 2, slatHeight, slatWidth / 2);

  ctx.restore();

  // Big post in center (unrotated for consistent shading)
  const size = UNIT_TO_PIXEL * 0.22;
  drawSquarePost(ctx, centerX, centerY, size, COLORS.TERRAIN.FENCE_POST, flashTimer);
}
