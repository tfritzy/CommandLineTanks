import { Mushroom } from "../objects/decorations/Mushroom";
import { drawMushrooms } from "../drawing/decorations/mushroom";
import { UNIT_TO_PIXEL } from "../constants";

const MUSHROOM_SPAWN_CHANCE = 0.27;
const MIN_MUSHROOMS_PER_TREE = 2;
const MAX_MUSHROOMS_PER_TREE = 5;
const MIN_DISTANCE_FROM_TREE = 0.5;
const MAX_DISTANCE_FROM_TREE = 2.5;
const MIN_MUSHROOM_SIZE = 0.085;
const MAX_MUSHROOM_SIZE = 0.125;

export class MushroomDecorationsManager {
  private mushrooms: Mushroom[] = [];
  private visibleMushroomsBuffer: Array<{ x: number; y: number; size: number }> = [];

  public generateMushroomsAroundTree(treeX: number, treeY: number, isWater: (x: number, y: number) => boolean): void {
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

      if (isWater(x, y)) {
        continue;
      }

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

    let writeIndex = 0;

    for (const mushroom of this.mushrooms) {
      const x = mushroom.getX();
      const y = mushroom.getY();

      if (x >= startX && x <= endX && y >= startY && y <= endY) {
        if (writeIndex >= this.visibleMushroomsBuffer.length) {
          this.visibleMushroomsBuffer.push({
            x: mushroom.getGameX(),
            y: mushroom.getGameY(),
            size: mushroom.getSize() * UNIT_TO_PIXEL,
          });
        } else {
          const mushroomInfo = this.visibleMushroomsBuffer[writeIndex];
          mushroomInfo.x = mushroom.getGameX();
          mushroomInfo.y = mushroom.getGameY();
          mushroomInfo.size = mushroom.getSize() * UNIT_TO_PIXEL;
        }
        writeIndex++;
      }
    }

    this.visibleMushroomsBuffer.length = writeIndex;

    drawMushrooms(ctx, this.visibleMushroomsBuffer);
  }

  public destroy(): void {
    this.mushrooms.length = 0;
    this.visibleMushroomsBuffer.length = 0;
  }
}
