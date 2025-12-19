import { getConnection } from "./spacetimedb-connection";
import { BaseTerrain, TerrainDetailType, type TerrainDetailRow, type EventContext } from "../module_bindings";
import { type Infer } from "spacetimedb";
import { TerrainDetailObject } from "./objects/TerrainDetailObject";
import { Cliff, Rock, Tree, Bridge, Fence, HayBale, Field, Label } from "./objects/TerrainDetails";

type BaseTerrainType = Infer<typeof BaseTerrain>;
type TerrainDetailTypeEnum = Infer<typeof TerrainDetailType>;

interface TerrainDetailData {
  id: string;
  positionX: number;
  positionY: number;
  type: TerrainDetailTypeEnum;
  health: number | undefined;
  label: string | undefined;
}

export class TerrainManager {
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: BaseTerrainType[] = [];
  private worldId: string;
  private detailObjects: Map<string, TerrainDetailObject> = new Map();
  private detailObjectsByPosition: (TerrainDetailObject | null)[][] = [];

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
      this.initializeDetailObjectsArray();
    });

    connection.db.world.onUpdate((_ctx, _oldWorld, newWorld) => {
      console.log("World data updated:", newWorld);
      this.worldWidth = newWorld.width;
      this.worldHeight = newWorld.height;
      this.baseTerrainLayer = newWorld.baseTerrainLayer;
      this.initializeDetailObjectsArray();
    });
  }

  private initializeDetailObjectsArray() {
    this.detailObjectsByPosition = [];
    for (let y = 0; y < this.worldHeight; y++) {
      this.detailObjectsByPosition[y] = new Array(this.worldWidth).fill(null);
    }
  }

  private subscribeToTerrainDetails() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("TerrainDetails subscription error", e))
      .subscribe([`SELECT * FROM terrain_detail WHERE WorldId = '${this.worldId}'`]);

    connection.db.terrainDetail.onInsert((_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
      this.createDetailObject(detail);
    });

    connection.db.terrainDetail.onUpdate((_ctx: EventContext, _oldDetail: Infer<typeof TerrainDetailRow>, newDetail: Infer<typeof TerrainDetailRow>) => {
      this.detailObjects.delete(newDetail.id);
      this.createDetailObject(newDetail);
    });

    connection.db.terrainDetail.onDelete((_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
      const obj = this.detailObjects.get(detail.id);
      if (obj) {
        const x = obj.getX();
        const y = obj.getY();
        if (y >= 0 && y < this.worldHeight && x >= 0 && x < this.worldWidth) {
          this.detailObjectsByPosition[y][x] = null;
        }
      }
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
      case "Label":
        obj = new Label(detail.positionX, detail.positionY, label, health);
        break;
    }
    
    if (obj) {
      this.detailObjects.set(detail.id, obj);
      const x = obj.getX();
      const y = obj.getY();
      if (y >= 0 && y < this.worldHeight && x >= 0 && x < this.worldWidth) {
        this.detailObjectsByPosition[y][x] = obj;
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

    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        if (tileX < 0 || tileX >= this.worldWidth || tileY < 0 || tileY >= this.worldHeight) {
          continue;
        }

        const index = tileY * this.worldWidth + tileX;
        const terrain = this.baseTerrainLayer[index];

        const worldX = (tileX - 0.5) * unitToPixel;
        const worldY = (tileY - 0.5) * unitToPixel;

        ctx.fillStyle = this.getBaseTerrainColor(terrain);
        ctx.fillRect(worldX, worldY, unitToPixel, unitToPixel);
        
        ctx.strokeStyle = "#4a4b5b22";
        ctx.lineWidth = 1;
        ctx.strokeRect(worldX, worldY, unitToPixel, unitToPixel);
      }
    }
  }

  public drawShadows(
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

    for (let y = Math.max(0, startTileY); y <= Math.min(this.worldHeight - 1, endTileY); y++) {
      for (let x = Math.min(this.worldWidth - 1, endTileX); x >= Math.max(0, startTileX); x--) {
        const obj = this.detailObjectsByPosition[y][x];
        if (obj) {
          obj.drawShadow(ctx);
        }
      }
    }
  }

  public drawBodies(
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

    for (let y = Math.max(0, startTileY); y <= Math.min(this.worldHeight - 1, endTileY); y++) {
      for (let x = Math.min(this.worldWidth - 1, endTileX); x >= Math.max(0, startTileX); x--) {
        const obj = this.detailObjectsByPosition[y][x];
        if (obj) {
          obj.drawBody(ctx);
        }
      }
    }
  }

  private getBaseTerrainColor(terrain: BaseTerrainType): string {
    switch (terrain.tag) {
      case "Ground":
        return "#2e2e43";
      case "Stream":
        return "#3e4c7e";
      case "Road":
        return "#808080";
      default:
        return "#ffffff";
    }
  }

  public getWorldWidth(): number {
    return this.worldWidth;
  }

  public getWorldHeight(): number {
    return this.worldHeight;
  }
}
