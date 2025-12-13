import { getConnection } from "./spacetimedb-connection";
import { BaseTerrain, TerrainDetail } from "../module_bindings";

export class TerrainManager {
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: number[] = [];
  private terrainDetailLayer: number[] = [];

  constructor() {
    this.subscribeToWorld();
  }

  private subscribeToWorld() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("TerrainManager subscription error", e))
      .subscribe([`SELECT * FROM world`]);

    connection.db.world.onInsert((_ctx, world) => {
      console.log("World data received:", world);
      this.worldWidth = world.width;
      this.worldHeight = world.height;
      this.baseTerrainLayer = world.baseTerrainLayer;
      this.terrainDetailLayer = world.terrainDetailLayer;
    });

    connection.db.world.onUpdate((_ctx, _oldWorld, newWorld) => {
      console.log("World data updated:", newWorld);
      this.worldWidth = newWorld.width;
      this.worldHeight = newWorld.height;
      this.baseTerrainLayer = newWorld.baseTerrainLayer;
      this.terrainDetailLayer = newWorld.terrainDetailLayer;
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

    this.drawBaseLayer(ctx, cameraX, cameraY, canvasWidth, canvasHeight, unitToPixel);
    this.drawDetailLayer(ctx, cameraX, cameraY, canvasWidth, canvasHeight, unitToPixel);
  }

  private drawBaseLayer(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number,
    unitToPixel: number
  ) {
    const startTileX = Math.floor(cameraX / unitToPixel);
    const endTileX = Math.ceil((cameraX + canvasWidth) / unitToPixel);
    const startTileY = Math.floor(cameraY / unitToPixel);
    const endTileY = Math.ceil((cameraY + canvasHeight) / unitToPixel);

    const offsetX = cameraX % unitToPixel;
    const offsetY = cameraY % unitToPixel;

    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        if (tileX < 0 || tileX >= this.worldWidth || tileY < 0 || tileY >= this.worldHeight) {
          continue;
        }

        const index = tileY * this.worldWidth + tileX;
        const terrain = this.baseTerrainLayer[index];

        const screenX = (tileX - startTileX) * unitToPixel - offsetX;
        const screenY = (tileY - startTileY) * unitToPixel - offsetY;

        ctx.fillStyle = this.getBaseTerrainColor(terrain);
        ctx.fillRect(screenX, screenY, unitToPixel, unitToPixel);
      }
    }
  }

  private drawDetailLayer(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number,
    unitToPixel: number
  ) {
    const startTileX = Math.floor(cameraX / unitToPixel);
    const endTileX = Math.ceil((cameraX + canvasWidth) / unitToPixel);
    const startTileY = Math.floor(cameraY / unitToPixel);
    const endTileY = Math.ceil((cameraY + canvasHeight) / unitToPixel);

    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        if (tileX < 0 || tileX >= this.worldWidth || tileY < 0 || tileY >= this.worldHeight) {
          continue;
        }

        const index = tileY * this.worldWidth + tileX;
        const detail = this.terrainDetailLayer[index];

        if (detail === TerrainDetail.None) {
          continue;
        }

        const worldX = tileX * unitToPixel;
        const worldY = tileY * unitToPixel;

        ctx.fillStyle = this.getTerrainDetailColor(detail);
        ctx.fillRect(worldX, worldY, unitToPixel, unitToPixel);
      }
    }
  }

  private getBaseTerrainColor(terrain: number): string {
    switch (terrain) {
      case BaseTerrain.Ground:
        return "#90ee90";
      case BaseTerrain.Stream:
        return "#4682b4";
      case BaseTerrain.Road:
        return "#808080";
      default:
        return "#90ee90";
    }
  }

  private getTerrainDetailColor(detail: number): string {
    switch (detail) {
      case TerrainDetail.Cliff:
        return "#8b7355";
      case TerrainDetail.Rock:
        return "#696969";
      case TerrainDetail.Tree:
        return "#228b22";
      case TerrainDetail.Bridge:
        return "#a0522d";
      case TerrainDetail.Fence:
        return "#d2691e";
      case TerrainDetail.HayBale:
        return "#f0e68c";
      case TerrainDetail.Field:
        return "#daa520";
      default:
        return "#ffffff";
    }
  }
}
