import { getConnection } from "../spacetimedb-connection";
import { BaseTerrain } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { generateLakeTextureSheet } from "../utils/lake-texture-generator";
import { getRenderTileCase } from "../utils/terrain-render-analyzer";
import { TERRAIN_COLORS, UNIT_TO_PIXEL } from "../constants";

type BaseTerrainType = Infer<typeof BaseTerrain>;

export class BaseTerrainManager {
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: BaseTerrainType[] = [];
  private worldId: string;
  private lakeTextureSheet: HTMLCanvasElement | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToWorld();
    this.lakeTextureSheet = generateLakeTextureSheet(UNIT_TO_PIXEL);
  }

  private subscribeToWorld() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("BaseTerrainManager subscription error", e))
      .subscribe([`SELECT * FROM world WHERE Id = '${this.worldId}'`]);

    connection.db.world.onInsert((_ctx, world) => {
      this.worldWidth = world.width;
      this.worldHeight = world.height;
      this.baseTerrainLayer = world.baseTerrainLayer;
    });

    connection.db.world.onUpdate((_ctx, _oldWorld, newWorld) => {
      this.worldWidth = newWorld.width;
      this.worldHeight = newWorld.height;
      this.baseTerrainLayer = newWorld.baseTerrainLayer;
    });
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.baseTerrainLayer.length === 0 || !this.lakeTextureSheet) return;

    const startRenderX = Math.floor(cameraX / UNIT_TO_PIXEL) - 1;
    const endRenderX = Math.ceil((cameraX + canvasWidth) / UNIT_TO_PIXEL) + 1;
    const startRenderY = Math.floor(cameraY / UNIT_TO_PIXEL) - 1;
    const endRenderY = Math.ceil((cameraY + canvasHeight) / UNIT_TO_PIXEL) + 1;

    const startTileX = Math.floor(cameraX / UNIT_TO_PIXEL);
    const endTileX = Math.ceil((cameraX + canvasWidth) / UNIT_TO_PIXEL);
    const startTileY = Math.floor(cameraY / UNIT_TO_PIXEL);
    const endTileY = Math.ceil((cameraY + canvasHeight) / UNIT_TO_PIXEL);

    ctx.fillStyle = TERRAIN_COLORS.GROUND;
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

        const worldX = tileX * UNIT_TO_PIXEL;
        const worldY = tileY * UNIT_TO_PIXEL;
        ctx.rect(worldX, worldY, UNIT_TO_PIXEL, UNIT_TO_PIXEL);
      }
    }
    ctx.fill();

    this.drawFarms(ctx, startTileX, endTileX, startTileY, endTileY);

    for (let renderY = startRenderY; renderY <= endRenderY; renderY++) {
      for (let renderX = startRenderX; renderX <= endRenderX; renderX++) {
        const tileCase = getRenderTileCase(
          this.baseTerrainLayer,
          this.worldWidth,
          this.worldHeight,
          renderX,
          renderY
        );

        if (tileCase === 0) continue;

        const sheetCol = tileCase % 4;
        const sheetRow = Math.floor(tileCase / 4);
        const srcX = sheetCol * UNIT_TO_PIXEL;
        const srcY = sheetRow * UNIT_TO_PIXEL;

        const worldX = Math.floor((renderX + 0.5) * UNIT_TO_PIXEL);
        const worldY = Math.floor((renderY + 0.5) * UNIT_TO_PIXEL);

        ctx.drawImage(
          this.lakeTextureSheet,
          srcX,
          srcY,
          UNIT_TO_PIXEL,
          UNIT_TO_PIXEL,
          worldX,
          worldY,
          UNIT_TO_PIXEL,
          UNIT_TO_PIXEL
        );
      }
    }

    // this.drawGrid(ctx, startTileX, endTileX, startTileY, endTileY);
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
    ctx.strokeStyle = TERRAIN_COLORS.GRID;
    ctx.lineWidth = 1;
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

        const worldX = tileX * UNIT_TO_PIXEL;
        const worldY = tileY * UNIT_TO_PIXEL;
        ctx.rect(worldX, worldY, UNIT_TO_PIXEL, UNIT_TO_PIXEL);
      }
    }
    ctx.stroke();
  }

  public getWorldWidth(): number {
    return this.worldWidth;
  }

  public getWorldHeight(): number {
    return this.worldHeight;
  }
}
