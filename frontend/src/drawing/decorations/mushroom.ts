import { COLORS } from "../../theme/colors";


export function drawMushrooms(
  ctx: CanvasRenderingContext2D,
  mushrooms: Array<{ x: number; y: number; size: number }>
) {
  if (mushrooms.length === 0) return;

  // Draw shadows
  ctx.fillStyle = COLORS.TERRAIN.MUSHROOM_SHADOW;
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
  ctx.fillStyle = COLORS.TERRAIN.MUSHROOM_CAP;
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
