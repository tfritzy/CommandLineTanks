import { getFlashColor } from "../../utils/colors";
import { TERRAIN_DETAIL_COLORS } from "../../constants";

export function drawDeadTreeShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const shadowOffsetX = -radius * 0.4;
  const shadowOffsetY = radius * 0.4;
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(centerX + shadowOffsetX, centerY + shadowOffsetY, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawDeadTreeBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = getFlashColor(TERRAIN_DETAIL_COLORS.DEAD_TREE.BASE, flashTimer);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = getFlashColor(TERRAIN_DETAIL_COLORS.DEAD_TREE.FOLIAGE, flashTimer);
  ctx.beginPath();
  const dividerCenterX = centerX + radius * 0.4;
  const dividerCenterY = centerY - radius * 0.4;
  const dividerRadius = radius * 1.3;
  ctx.arc(dividerCenterX, dividerCenterY, dividerRadius, 0, Math.PI * 2);
  ctx.fill();
}
