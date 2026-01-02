import { Mushroom } from "../objects/decorations/Mushroom";
import { drawMushroom } from "../drawing/decorations/mushroom";
import { UNIT_TO_PIXEL } from "../constants";
import { TerrainDetailObject } from "../objects/terrain-details/TerrainDetailObject";

export class MushroomDecorationsManager {
  private mushrooms: Mushroom[] = [];

  public generateMushroomsAroundTrees(trees: TerrainDetailObject[]): void {
    this.mushrooms = [];

    for (const tree of trees) {
      const treeX = tree.getX();
      const treeY = tree.getY();

      const seed = treeX * 13.37 + treeY * 42.42;
      const pseudoRandom1 = Math.abs(Math.sin(seed * 12345.6789) * 10000) % 1;
      
      const spawnChance = 0.6;
      if (pseudoRandom1 > spawnChance) {
        continue;
      }

      const pseudoRandom2 = Math.abs(Math.sin(seed * 98765.4321) * 10000) % 1;
      const mushroomCount = 1 + Math.floor(pseudoRandom2 * 4);

      for (let i = 0; i < mushroomCount; i++) {
        const angleSeed = seed + i * 7.77;
        const distSeed = seed + i * 3.33;
        const sizeSeed = seed + i * 9.99;
        const rotSeed = seed + i * 5.55;
        
        const angle = (Math.abs(Math.sin(angleSeed * 11111.1111) * 10000) % 1) * Math.PI * 2;
        const distance = 0.5 + (Math.abs(Math.sin(distSeed * 22222.2222) * 10000) % 1) * 1.5;
        
        const x = treeX + Math.cos(angle) * distance;
        const y = treeY + Math.sin(angle) * distance;

        const size = 0.1 + (Math.abs(Math.sin(sizeSeed * 33333.3333) * 10000) % 1) * 0.15;
        const rotation = (Math.abs(Math.sin(rotSeed * 44444.4444) * 10000) % 1) * Math.PI * 2;

        const mushroom = new Mushroom(x, y, size, rotation);
        this.mushrooms.push(mushroom);
      }
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

    for (const mushroom of this.mushrooms) {
      const x = mushroom.getX();
      const y = mushroom.getY();

      if (x >= startX && x <= endX && y >= startY && y <= endY) {
        const worldX = mushroom.getWorldX();
        const worldY = mushroom.getWorldY();
        const size = mushroom.getSize() * UNIT_TO_PIXEL;
        const rotation = mushroom.getRotation();
        const seed = mushroom.getSeed();

        drawMushroom(ctx, worldX, worldY, size, rotation, seed);
      }
    }
  }
}
