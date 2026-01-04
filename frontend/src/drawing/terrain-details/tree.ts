import { getFlashColor } from "../../utils/colors";
import { COLORS, PALETTE } from "../../theme/colors";


export function drawTreeShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  const shadowOffsetX = -radius * 0.4;
  const shadowOffsetY = radius * 0.4;
  ctx.fillStyle = PALETTE.BLACK_PURE + "4d";
  ctx.beginPath();
  ctx.arc(centerX + shadowOffsetX, centerY + shadowOffsetY, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTreeBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const colors = { BASE: COLORS.TERRAIN.TREE_BASE, FOLIAGE: COLORS.TERRAIN.TREE_FOLIAGE };

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = getFlashColor(colors.BASE, flashTimer);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = getFlashColor(colors.FOLIAGE, flashTimer);
  ctx.beginPath();
  const dividerCenterX = centerX + radius * 0.4;
  const dividerCenterY = centerY - radius * 0.4;
  const dividerRadius = radius * 1.3;
  ctx.arc(dividerCenterX, dividerCenterY, dividerRadius, 0, Math.PI * 2);
  ctx.fill();
}
