import { Mushroom } from "../objects/decorations/Mushroom";
import { drawMushrooms } from "../drawing/decorations/mushroom";
import { UNIT_TO_PIXEL } from "../constants";

const MUSHROOM_SPAWN_CHANCE = 0.2;
const MIN_MUSHROOMS_PER_TREE = 1;
const MAX_MUSHROOMS_PER_TREE = 2;
const MIN_DISTANCE_FROM_TREE = 0.5;
const MAX_DISTANCE_FROM_TREE = 1.5;
const MIN_MUSHROOM_SIZE = 0.08;
const MAX_MUSHROOM_SIZE = 0.15;

export class MushroomDecorationsManager {
  private mushrooms: Mushroom[] = [];
  private visibleMushroomsBuffer: Array<{ x: number; y: number; size: number }> = [];

  public generateMushroomsAroundTree(treeX: number, treeY: number): void {
    const seed = treeX * 13.37 + treeY * 42.42;
    const pseudoRandom1 = Math.abs(Math.sin(seed * 12345.6789) * 10000) % 1;
    
    if (pseudoRandom1 > MUSHROOM_SPAWN_CHANCE) {
      return;
    }

    const pseudoRandom2 = Math.abs(Math.sin(seed * 98765.4321) * 10000) % 1;
    const mushroomCount = MIN_MUSHROOMS_PER_TREE + Math.floor(pseudoRandom2 * (MAX_MUSHROOMS_PER_TREE - MIN_MUSHROOMS_PER_TREE + 1));

    for (let i = 0; i < mushroomCount; i++) {
      const angleSeed = seed + i * 7.77;
      const distSeed = seed + i * 3.33;
      const sizeSeed = seed + i * 9.99;
      
      const angle = (Math.abs(Math.sin(angleSeed * 11111.1111) * 10000) % 1) * Math.PI * 2;
      const distance = MIN_DISTANCE_FROM_TREE + (Math.abs(Math.sin(distSeed * 22222.2222) * 10000) % 1) * (MAX_DISTANCE_FROM_TREE - MIN_DISTANCE_FROM_TREE);
      
      const x = treeX + Math.cos(angle) * distance;
      const y = treeY + Math.sin(angle) * distance;

      const size = MIN_MUSHROOM_SIZE + (Math.abs(Math.sin(sizeSeed * 33333.3333) * 10000) % 1) * (MAX_MUSHROOM_SIZE - MIN_MUSHROOM_SIZE);

      const mushroom = new Mushroom(x, y, size);
      this.mushrooms.push(mushroom);
    }
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const padding = 2;
    const startX = cameraX / UNIT_TO_PIXEL - padding;
    const endX = (cameraX + canvasWidth) / UNIT_TO_PIXEL + padding;
    const startY = cameraY / UNIT_TO_PIXEL - padding;
    const endY = (cameraY + canvasHeight) / UNIT_TO_PIXEL + padding;

    this.visibleMushroomsBuffer.length = 0;

    for (const mushroom of this.mushrooms) {
      const x = mushroom.getX();
      const y = mushroom.getY();

      if (x >= startX && x <= endX && y >= startY && y <= endY) {
        this.visibleMushroomsBuffer.push({
          x: mushroom.getWorldX(),
          y: mushroom.getWorldY(),
          size: mushroom.getSize() * UNIT_TO_PIXEL,
        });
      }
    }

    drawMushrooms(ctx, this.visibleMushroomsBuffer);
  }
}
