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

    connection.db.terrainDetail.onInsert((_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
      this.createDetailObject(detail);
    });

    connection.db.terrainDetail.onUpdate((_ctx: EventContext, _oldDetail: Infer<typeof TerrainDetailRow>, newDetail: Infer<typeof TerrainDetailRow>) => {
      this.detailObjects.delete(newDetail.id);
      this.createDetailObject(newDetail);
    });

    connection.db.terrainDetail.onDelete((_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
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

  private getVisibleObjectsSorted(
    startTileX: number,
    endTileX: number,
    startTileY: number,
    endTileY: number,
    filterFn: (obj: TerrainDetailObject) => boolean
  ): TerrainDetailObject[] {
    return Array.from(this.detailObjects.values())
      .filter(obj => {
        const x = obj.getX();
        const y = obj.getY();
        return filterFn(obj) && x >= startTileX && x <= endTileX && y >= startTileY && y <= endTileY;
      })
      .sort((a, b) => {
        const yDiff = a.getY() - b.getY();
        if (yDiff !== 0) return yDiff;
        return b.getX() - a.getX();
      });
  }

  public drawTreeShadows(
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

    const visibleTrees = this.getVisibleObjectsSorted(
      startTileX,
      endTileX,
      startTileY,
      endTileY,
      (obj) => obj instanceof Tree
    );

    for (const obj of visibleTrees) {
      obj.drawShadow(ctx);
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

    const visibleObjects = this.getVisibleObjectsSorted(
      startTileX,
      endTileX,
      startTileY,
      endTileY,
      (obj) => !(obj instanceof Tree)
    );

    for (const obj of visibleObjects) {
      obj.draw(ctx);
    }
  }

  public drawTreeBodies(
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

    const visibleTrees = this.getVisibleObjectsSorted(
      startTileX,
      endTileX,
      startTileY,
      endTileY,
      (obj) => obj instanceof Tree
    );

    for (const obj of visibleTrees) {
      obj.drawBody(ctx);
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
