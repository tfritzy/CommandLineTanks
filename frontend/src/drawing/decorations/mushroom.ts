import { DECORATION_COLORS } from "../../constants";

export function drawMushrooms(
  ctx: CanvasRenderingContext2D,
  mushrooms: Array<{ x: number; y: number; size: number }>
) {
  if (mushrooms.length === 0) return;

  const color = DECORATION_COLORS.MUSHROOM.CAP;

  ctx.fillStyle = color;
  ctx.beginPath();

  for (const mushroom of mushrooms) {
    ctx.arc(mushroom.x, mushroom.y, mushroom.size, 0, Math.PI * 2);
  }

  ctx.fill();
}
