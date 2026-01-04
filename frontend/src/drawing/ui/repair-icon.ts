import { COLORS } from "../../theme/colors";

const REPAIR_ICON_READY_COLOR = COLORS.ABILITY.REPAIR_READY;
const REPAIR_ICON_COOLDOWN_COLOR = COLORS.ABILITY.COOLDOWN;
const CROSS_WIDTH_SCALE = 0.15;
const CROSS_HEIGHT_SCALE = 0.5;

export function drawRepairIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  isReady: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  const color = isReady ? REPAIR_ICON_READY_COLOR : REPAIR_ICON_COOLDOWN_COLOR;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;

  const crossWidth = size * CROSS_WIDTH_SCALE;
  const crossHeight = size * CROSS_HEIGHT_SCALE;
  
  ctx.fillRect(-crossWidth / 2, -crossHeight / 2, crossWidth, crossHeight);
  ctx.fillRect(-crossHeight / 2, -crossWidth / 2, crossHeight, crossWidth);

  ctx.restore();
}
