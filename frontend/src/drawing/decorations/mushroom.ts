import { DECORATION_COLORS } from "../../constants";

export function drawMushrooms(
  ctx: CanvasRenderingContext2D,
  mushrooms: Array<{ x: number; y: number; size: number }>
) {
  if (mushrooms.length === 0) return;

  // Draw shadows
  ctx.fillStyle = DECORATION_COLORS.MUSHROOM.SHADOW;
  ctx.beginPath();
  for (const mushroom of mushrooms) {
    const shadowOffset = mushroom.size * 0.3;
    const x = Math.round(mushroom.x - shadowOffset);
    const y = Math.round(mushroom.y + shadowOffset);
    const size = Math.round(mushroom.size);
    
    ctx.moveTo(x + size, y);
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
  ctx.fill();

  // Draw caps
  ctx.fillStyle = DECORATION_COLORS.MUSHROOM.CAP;
  ctx.beginPath();
  for (const mushroom of mushrooms) {
    const x = Math.round(mushroom.x);
    const y = Math.round(mushroom.y);
    const size = Math.round(mushroom.size);
    
    ctx.moveTo(x + size, y);
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
  ctx.fill();
}
