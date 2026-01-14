import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";


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
  ctx.arc(centerX + shadowOffsetX, centerY + shadowOffsetY, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();
}

export function drawDeadTreeBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const colors = { BASE: COLORS.TERRAIN.DEAD_TREE_BASE, FOLIAGE: COLORS.TERRAIN.DEAD_TREE_FOLIAGE };

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = getFlashColor(colors.BASE, flashTimer);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = getFlashColor(colors.FOLIAGE, flashTimer);
  ctx.beginPath();
  const dividerCenterX = centerX + radius * 0.3;
  const dividerCenterY = centerY - radius * 0.3;
  const dividerRadius = radius * 1.0;
  ctx.arc(dividerCenterX, dividerCenterY, dividerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
