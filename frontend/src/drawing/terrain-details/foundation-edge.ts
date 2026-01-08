import { UNIT_TO_PIXEL } from "../../constants";
import { getFlashColor } from "../../utils/colors";
import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";

export function drawFoundationEdgeShadow(
  _ctx: CanvasRenderingContext2D,
  _x: number,
  _y: number,
  _centerX: number,
  _centerY: number,
  _rotation: number
) {
}

export function drawFoundationEdgeBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number,
  flashTimer: number
) {
  ctx.save();

  ctx.translate(centerX, centerY);
  ctx.rotate((rotation * 90 * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  const baseColor = getFlashColor(COLORS.TERRAIN.FOUNDATION_BASE, flashTimer);

  setGlow(ctx, baseColor, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - UNIT_TO_PIXEL * 0.5, y - UNIT_TO_PIXEL * 0.15, UNIT_TO_PIXEL, UNIT_TO_PIXEL * 0.3);
  clearGlow(ctx);

  ctx.restore();
}
