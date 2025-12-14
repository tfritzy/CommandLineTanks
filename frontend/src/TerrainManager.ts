import { getConnection } from "./spacetimedb-connection";
import { BaseTerrain, TerrainDetailType, type Infer } from "../module_bindings";
import { TerrainDetailObject } from "./objects/TerrainDetailObject";
import { Cliff, Rock, Tree, Bridge, Fence, HayBale, Field } from "./objects/TerrainDetails";

type BaseTerrainType = Infer<typeof BaseTerrain>;
type TerrainDetailTypeEnum = Infer<typeof TerrainDetailType>;

interface TerrainDetailData {
  id: string;
  positionX: number;
  positionY: number;
  type: TerrainDetailTypeEnum;
  health: number;
  label: string | null;
}

export class TerrainManager {
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: BaseTerrainType[] = [];
  private worldId: string;
  private detailObjects: Map<string, TerrainDetailObject> = new Map();

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToWorld();
    this.subscribeToTerrainDetails();
  }

  private subscribeToWorld() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("TerrainManager subscription error", e))
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

  private subscribeToTerrainDetails() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("TerrainDetails subscription error", e))
      .subscribe([`SELECT * FROM terrain_detail WHERE WorldId = '${this.worldId}'`]);

    connection.db.terrain_detail.onInsert((_ctx, detail) => {
      this.createDetailObject(detail);
    });

    connection.db.terrain_detail.onUpdate((_ctx, _oldDetail, newDetail) => {
      this.detailObjects.delete(newDetail.id);
      this.createDetailObject(newDetail);
    });

    connection.db.terrain_detail.onDelete((_ctx, detail) => {
      this.detailObjects.delete(detail.id);
    });
  }

  private createDetailObject(detail: TerrainDetailData) {
    let obj: TerrainDetailObject | null = null;
    
    const label = detail.label || null;
    const health = detail.health || 100;
    
    switch (detail.type.tag) {
      case "Cliff":
        obj = new Cliff(detail.positionX, detail.positionY, label, health);
        break;
      case "Rock":
        obj = new Rock(detail.positionX, detail.positionY, label, health);
        break;
      case "Tree":
        obj = new Tree(detail.positionX, detail.positionY, label, health);
        break;
      case "Bridge":
        obj = new Bridge(detail.positionX, detail.positionY, label, health);
        break;
      case "Fence":
        obj = new Fence(detail.positionX, detail.positionY, label, health);
        break;
      case "HayBale":
        obj = new HayBale(detail.positionX, detail.positionY, label, health);
        break;
      case "Field":
        obj = new Field(detail.positionX, detail.positionY, label, health);
        break;
    }
    
    if (obj) {
      this.detailObjects.set(detail.id, obj);
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

    for (const obj of this.detailObjects.values()) {
      const x = obj.getX();
      const y = obj.getY();
      
      if (x >= startTileX && x <= endTileX && y >= startTileY && y <= endTileY) {
        obj.draw(ctx);
      }
    }
  }

  private getBaseTerrainColor(terrain: BaseTerrainType): string {
    switch (terrain.tag) {
      case "Ground":
        return "#90ee90";
      case "Stream":
        return "#4682b4";
      case "Road":
        return "#808080";
      default:
        return "#90ee90";
    }
  }
}
