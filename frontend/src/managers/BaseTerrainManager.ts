import { BaseTerrain } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { TERRAIN_COLORS, UNIT_TO_PIXEL } from "../constants";

type BaseTerrainType = Infer<typeof BaseTerrain>;

export class BaseTerrainManager {
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: BaseTerrainType[] = [];

  constructor() {
  }

  public updateWorld(
    width: number,
    height: number,
    baseTerrainLayer: BaseTerrainType[]
  ) {
    this.worldWidth = width;
    this.worldHeight = height;
    this.baseTerrainLayer = baseTerrainLayer;
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.baseTerrainLayer.length === 0) return;

    const startTileX = Math.floor(cameraX / UNIT_TO_PIXEL);
    const endTileX = Math.ceil((cameraX + canvasWidth) / UNIT_TO_PIXEL);
    const startTileY = Math.floor(cameraY / UNIT_TO_PIXEL);
    const endTileY = Math.ceil((cameraY + canvasHeight) / UNIT_TO_PIXEL);

    this.drawFarms(ctx, startTileX, endTileX, startTileY, endTileY);

    this.drawGrid(ctx, startTileX, endTileX, startTileY, endTileY);
  }

  private drawFarms(
    ctx: CanvasRenderingContext2D,
    startTileX: number,
    endTileX: number,
    startTileY: number,
    endTileY: number
  ) {
    ctx.fillStyle = TERRAIN_COLORS.FARM_GROOVE;
    const numGrooves = 2;
    const grooveHeight = UNIT_TO_PIXEL * 0.15;

    ctx.beginPath();
    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        if (
          tileX < 0 ||
          tileX >= this.worldWidth ||
          tileY < 0 ||
          tileY >= this.worldHeight
        ) {
          continue;
        }

        const index = tileY * this.worldWidth + tileX;
        const terrain = this.baseTerrainLayer[index];

        if (terrain.tag === "Farm") {
          const worldX = tileX * UNIT_TO_PIXEL;
          const worldY = tileY * UNIT_TO_PIXEL;

          for (let i = 0; i < numGrooves; i++) {
            const grooveY =
              worldY +
              UNIT_TO_PIXEL * ((i + 0.5) / numGrooves) -
              grooveHeight / 2;
            ctx.rect(worldX, grooveY, UNIT_TO_PIXEL, grooveHeight);
          }
        }
      }
    }
    ctx.fill();
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    startTileX: number,
    endTileX: number,
    startTileY: number,
    endTileY: number
  ) {
    ctx.fillStyle = TERRAIN_COLORS.CHECKER;
    ctx.beginPath();

    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        if (
          tileX < 0 ||
          tileX >= this.worldWidth ||
          tileY < 0 ||
          tileY >= this.worldHeight
        ) {
          continue;
        }

        if ((tileX + tileY) % 2 === 0) {
          const worldX = tileX * UNIT_TO_PIXEL;
          const worldY = tileY * UNIT_TO_PIXEL;
          ctx.rect(worldX, worldY, UNIT_TO_PIXEL, UNIT_TO_PIXEL);
        }
      }
    }
    ctx.fill();
  }

  public getWorldWidth(): number {
    return this.worldWidth;
  }

  public getWorldHeight(): number {
    return this.worldHeight;
  }

  public getBaseTerrainLayer(): BaseTerrainType[] {
    return this.baseTerrainLayer;
  }
}
