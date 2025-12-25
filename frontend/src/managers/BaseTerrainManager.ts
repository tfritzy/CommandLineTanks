import { getConnection } from "../spacetimedb-connection";
import { BaseTerrain } from "../../module_bindings";
import { type Infer } from "spacetimedb";

type BaseTerrainType = Infer<typeof BaseTerrain>;

export class BaseTerrainManager {
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: BaseTerrainType[] = [];
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToWorld();
  }

  private subscribeToWorld() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("BaseTerrainManager subscription error", e))
      .subscribe([`SELECT * FROM world WHERE Id = '${this.worldId}'`]);

    connection.db.world.onInsert((_ctx, world) => {
      console.log("World data received:", world);
      this.worldWidth = world.width;
      this.worldHeight = world.height;
      this.baseTerrainLayer = world.baseTerrainLayer;
    });

    connection.db.world.onUpdate((_ctx, _oldWorld, newWorld) => {
      console.log("World data updated:", newWorld);
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
    canvasHeight: number,
    unitToPixel: number
  ) {
    if (this.baseTerrainLayer.length === 0) return;

    const startTileX = Math.floor(cameraX / unitToPixel);
    const endTileX = Math.ceil((cameraX + canvasWidth) / unitToPixel);
    const startTileY = Math.floor(cameraY / unitToPixel);
    const endTileY = Math.ceil((cameraY + canvasHeight) / unitToPixel);

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

        const worldX = tileX * unitToPixel;
        const worldY = tileY * unitToPixel;
        ctx.rect(worldX, worldY, unitToPixel, unitToPixel);
      }
    }
    ctx.fillStyle = "#2e2e43";
    ctx.fill();

    ctx.fillStyle = "#313148";
    const numGrooves = 2;
    const grooveHeight = unitToPixel * 0.15;
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
          const worldX = tileX * unitToPixel;
          const worldY = tileY * unitToPixel;

          for (let i = 0; i < numGrooves; i++) {
            const grooveY =
              worldY +
              unitToPixel * ((i + 0.5) / numGrooves) -
              grooveHeight / 2;
            ctx.rect(worldX, grooveY, unitToPixel, grooveHeight);
          }
        }
      }
    }
    ctx.fill();

    ctx.strokeStyle = "#4a4b5b22";
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

        const worldX = tileX * unitToPixel;
        const worldY = tileY * unitToPixel;
        ctx.rect(worldX, worldY, unitToPixel, unitToPixel);
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
