import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";


export function drawTreeShadow(
  _ctx: CanvasRenderingContext2D,
  _centerX: number,
  _centerY: number,
  _radius: number
) {
}

export function drawTreeBody(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  flashTimer: number
) {
  const outlineColor = getFlashColor(COLORS.TERRAIN.TREE_FOLIAGE, flashTimer);

  ctx.save();
  
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  setGlow(ctx, outlineColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  clearGlow(ctx);
  
  ctx.restore();
}
