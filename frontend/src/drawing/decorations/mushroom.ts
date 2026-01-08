import { COLORS } from "../../theme/colors";
import { setGlow, clearGlow, NEON_GLOW_BLUR_MEDIUM } from "../../utils/neon";


export function drawMushrooms(
  ctx: CanvasRenderingContext2D,
  mushrooms: Array<{ x: number; y: number; size: number }>
) {
  if (mushrooms.length === 0) return;

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
