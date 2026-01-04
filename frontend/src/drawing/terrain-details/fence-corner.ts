import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
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
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const totalHeight = railWidth + slatHeight;

  const hSlatY = y - totalHeight / 2;
  const vSlatX = x - totalHeight / 2;

  // Horizontal bar shadow
  ctx.fillRect(vSlatX, hSlatY, UNIT_TO_PIXEL * 0.5 + (x - vSlatX), totalHeight);
  // Vertical bar shadow
  ctx.fillRect(vSlatX, hSlatY, totalHeight, UNIT_TO_PIXEL * 0.5 + (y - hSlatY));

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
  const slatHeight = UNIT_TO_PIXEL * 0.035;
  const totalHeight = railWidth + slatHeight;

  ctx.fillStyle = postColor;
  const hSlatY = y - totalHeight / 2;
  const vSlatX = x - totalHeight / 2;

  // Horizontal bar
  ctx.fillRect(vSlatX, hSlatY, UNIT_TO_PIXEL * 0.5 + (x - vSlatX), totalHeight);
  // Vertical bar
  ctx.fillRect(vSlatX, hSlatY, totalHeight, UNIT_TO_PIXEL * 0.5 + (y - hSlatY));

  ctx.restore();

  // Big post in center (unrotated for consistent shading)
  const size = UNIT_TO_PIXEL * 0.22;
  drawSquarePost(ctx, centerX, centerY, size, COLORS.TERRAIN.FENCE_POST, flashTimer);
}
