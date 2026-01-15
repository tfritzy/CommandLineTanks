import { Flower } from "../objects/decorations/Flower";
import { drawFlowers, getVariationCount } from "../drawing/decorations/flower";
import { UNIT_TO_PIXEL } from "../constants";
import { type Infer } from "spacetimedb";
import { BaseTerrain } from "../../module_bindings";

type BaseTerrainType = Infer<typeof BaseTerrain>;

const FLOWER_SPAWN_CHANCE = 0.15;
const FLOWER_CIRCLE_RADIUS = 0.5;

export class FlowerDecorationsManager {
  private flowers: Flower[] = [];
  private visibleFlowersBuffer: Array<{ x: number; y: number; variation: number }> = [];
  private occupiedCircles: Set<string> = new Set();

  public generateFlowersOnTerrain(
    baseTerrainLayer: BaseTerrainType[],
    gameWidth: number,
    gameHeight: number,
    detailObjectsByPosition: (any | null)[][]
  ): void {
    this.flowers = [];
    this.occupiedCircles.clear();

    for (let y = 0; y < gameHeight; y++) {
      for (let x = 0; x < gameWidth; x++) {
        const index = y * gameWidth + x;
        const terrain = baseTerrainLayer[index];

        if (terrain.tag !== "Ground") {
          continue;
        }

        if (detailObjectsByPosition[y] && detailObjectsByPosition[y][x]) {
          continue;
        }

        const seed = x * 13.37 + y * 42.42;
        const pseudoRandom = Math.abs(Math.sin(seed * 12345.6789) * 10000) % 1;

        if (pseudoRandom > FLOWER_SPAWN_CHANCE) {
          continue;
        }

        const circleKey = this.getCircleKey(x, y);
        if (this.isCircleOccupied(x, y)) {
          continue;
        }

        this.occupiedCircles.add(circleKey);

        const variationSeed = seed * 98765.4321;
        const variation = Math.floor(Math.abs(Math.sin(variationSeed) * 10000) % getVariationCount());

        const flower = new Flower(x + 0.5, y + 0.5, variation);
        this.flowers.push(flower);
      }
    }
  }

  private getCircleKey(tileX: number, tileY: number): string {
    return `${tileX},${tileY}`;
  }

  private isCircleOccupied(tileX: number, tileY: number): boolean {
    const checkRadius = Math.ceil(FLOWER_CIRCLE_RADIUS * 2);

    for (let dy = -checkRadius; dy <= checkRadius; dy++) {
      for (let dx = -checkRadius; dx <= checkRadius; dx++) {
        const checkX = tileX + dx;
        const checkY = tileY + dy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= FLOWER_CIRCLE_RADIUS * 2) {
          const key = this.getCircleKey(checkX, checkY);
          if (this.occupiedCircles.has(key)) {
            return true;
          }
        }
      }
    }

    return false;
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

    for (const flower of this.flowers) {
      const x = flower.getX();
      const y = flower.getY();

      if (x >= startX && x <= endX && y >= startY && y <= endY) {
        if (writeIndex >= this.visibleFlowersBuffer.length) {
          this.visibleFlowersBuffer.push({
            x: flower.getGameX(),
            y: flower.getGameY(),
            variation: flower.getVariation(),
          });
        } else {
          const flowerInfo = this.visibleFlowersBuffer[writeIndex];
          flowerInfo.x = flower.getGameX();
          flowerInfo.y = flower.getGameY();
          flowerInfo.variation = flower.getVariation();
        }
        writeIndex++;
      }
    }

    this.visibleFlowersBuffer.length = writeIndex;

    drawFlowers(ctx, this.visibleFlowersBuffer);
  }

  public destroy(): void {
    this.flowers.length = 0;
    this.visibleFlowersBuffer.length = 0;
    this.occupiedCircles.clear();
  }
}
