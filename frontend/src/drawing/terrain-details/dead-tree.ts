import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";


export function drawDeadTreeShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const stumpRadius = radius * 0.35;
  const shadowOffsetX = -radius * 0.08;
  const shadowOffsetY = radius * 0.08;
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.beginPath();
  ctx.arc(centerX + shadowOffsetX, centerY + shadowOffsetY, stumpRadius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawDeadTreeBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const colors = { BARK: COLORS.TERRAIN.DEAD_TREE_BASE, WOOD: COLORS.TERRAIN.DEAD_TREE_FOLIAGE };
  const stumpRadius = radius * 0.35;

  // Outer bark
  ctx.fillStyle = getFlashColor(colors.BARK, flashTimer);
  ctx.beginPath();
  ctx.arc(centerX, centerY, stumpRadius, 0, Math.PI * 2);
  ctx.fill();

  // Inner wood surface
  ctx.fillStyle = getFlashColor(colors.WOOD, flashTimer);
  ctx.beginPath();
  ctx.arc(centerX, centerY, stumpRadius * 0.7, 0, Math.PI * 2);
  ctx.fill();
}
