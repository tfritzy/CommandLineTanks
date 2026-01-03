import { mushroomTextureSheet } from "../../texture-sheets/MushroomTextureSheet";

export function drawMushroomsTextureSheet(
  ctx: CanvasRenderingContext2D,
  mushrooms: Array<{ x: number; y: number; size: number }>
) {
  if (mushrooms.length === 0) return;

  for (const mushroom of mushrooms) {
    mushroomTextureSheet.drawMushroom(
      ctx,
      mushroom.x,
      mushroom.y,
      mushroom.size
    );
  }
}
