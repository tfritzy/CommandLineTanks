import { getConnection } from "./spacetimedb-connection";
import { BaseTerrain, TerrainDetail } from "../module_bindings";
import { TerrainDetailObject } from "./objects/TerrainDetailObject";
import { Cliff, Rock, Tree, Bridge, Fence, HayBale, Field } from "./objects/TerrainDetails";

export class TerrainManager {
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: number[] = [];
  private terrainDetailLayer: number[] = [];
  private worldId: string;
  private detailObjects: TerrainDetailObject[] = [];

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToWorld();
  }

  private subscribeToWorld() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("TerrainManager subscription error", e))
      .subscribe([`SELECT * FROM world WHERE id = '${this.worldId}'`]);

    connection.db.world.onInsert((_ctx, world) => {
      console.log("World data received:", world);
      this.worldWidth = world.width;
      this.worldHeight = world.height;
      this.baseTerrainLayer = world.baseTerrainLayer;
      this.terrainDetailLayer = world.terrainDetailLayer;
      this.createDetailObjects();
    });

    connection.db.world.onUpdate((_ctx, _oldWorld, newWorld) => {
      console.log("World data updated:", newWorld);
      this.worldWidth = newWorld.width;
      this.worldHeight = newWorld.height;
      this.baseTerrainLayer = newWorld.baseTerrainLayer;
      this.terrainDetailLayer = newWorld.terrainDetailLayer;
      this.createDetailObjects();
    });
  }

  private createDetailObjects() {
    this.detailObjects = [];
    
    for (let y = 0; y < this.worldHeight; y++) {
      for (let x = 0; x < this.worldWidth; x++) {
        const index = y * this.worldWidth + x;
        const detail = this.terrainDetailLayer[index];
        
        if (detail === TerrainDetail.None) {
          continue;
        }
        
        let obj: TerrainDetailObject | null = null;
        
        switch (detail) {
          case TerrainDetail.Cliff:
            obj = new Cliff(x, y);
            break;
          case TerrainDetail.Rock:
            obj = new Rock(x, y);
            break;
          case TerrainDetail.Tree:
            obj = new Tree(x, y);
            break;
          case TerrainDetail.Bridge:
            obj = new Bridge(x, y);
            break;
          case TerrainDetail.Fence:
            obj = new Fence(x, y);
            break;
          case TerrainDetail.HayBale:
            obj = new HayBale(x, y);
            break;
          case TerrainDetail.Field:
            obj = new Field(x, y);
            break;
        }
        
        if (obj) {
          this.detailObjects.push(obj);
        }
      }
    }
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

    for (const obj of this.detailObjects) {
      const x = obj.getX();
      const y = obj.getY();
      
      if (x >= startTileX && x <= endTileX && y >= startTileY && y <= endTileY) {
        obj.draw(ctx);
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
}
