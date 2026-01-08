import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM, getNeonFillColor, getNeonShadowColor } from "../../utils/neon";


export function drawMushrooms(
  ctx: CanvasRenderingContext2D,
  mushrooms: Array<{ x: number; y: number; size: number }>
) {
  if (mushrooms.length === 0) return;

  const shadowColor = getNeonShadowColor(COLORS.TERRAIN.MUSHROOM_CAP);
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  for (const mushroom of mushrooms) {
    const shadowOffset = 2;
    const x = Math.round(mushroom.x - shadowOffset);
    const y = Math.round(mushroom.y + shadowOffset);
    const size = Math.round(mushroom.size);

    ctx.moveTo(x + size, y);
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
  ctx.fill();

  const fillColor = getNeonFillColor(COLORS.TERRAIN.MUSHROOM_CAP);
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  for (const mushroom of mushrooms) {
    const x = Math.round(mushroom.x);
    const y = Math.round(mushroom.y);
    const size = Math.round(mushroom.size);

    ctx.moveTo(x + size, y);
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
  ctx.fill();

  setGlow(ctx, COLORS.TERRAIN.MUSHROOM_CAP, NEON_GLOW_BLUR_MEDIUM);
  ctx.strokeStyle = COLORS.TERRAIN.MUSHROOM_CAP;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const mushroom of mushrooms) {
    const x = Math.round(mushroom.x);
    const y = Math.round(mushroom.y);
    const size = Math.round(mushroom.size);

    ctx.moveTo(x + size, y);
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
  ctx.stroke();
  clearGlow(ctx);
}
