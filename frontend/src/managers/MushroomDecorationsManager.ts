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

      const spawnChance = 0.6;
      if (Math.random() > spawnChance) {
        continue;
      }

      const mushroomCount = 1 + Math.floor(Math.random() * 4);

      for (let i = 0; i < mushroomCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 0.5 + Math.random() * 1.5;
        
        const x = treeX + Math.cos(angle) * distance;
        const y = treeY + Math.sin(angle) * distance;

        const size = 0.1 + Math.random() * 0.15;
        const rotation = Math.random() * Math.PI * 2;

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
