import { getConnection } from "../spacetimedb-connection";
import { BaseTerrain, type TerrainDetailRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { TerrainDetailObject } from "../objects/terrain-details/TerrainDetailObject";
import { Rock } from "../objects/terrain-details/Rock";
import { Tree } from "../objects/terrain-details/Tree";
import { HayBale } from "../objects/terrain-details/HayBale";
import { Label } from "../objects/terrain-details/Label";
import { FoundationEdge } from "../objects/terrain-details/FoundationEdge";
import { FoundationCorner } from "../objects/terrain-details/FoundationCorner";
import { FenceEdge } from "../objects/terrain-details/FenceEdge";
import { FenceCorner } from "../objects/terrain-details/FenceCorner";
import { TargetDummy } from "../objects/terrain-details/TargetDummy";
import { UNIT_TO_PIXEL } from "../game";
import { TerrainDebrisParticlesManager } from "./TerrainDebrisParticlesManager";

type BaseTerrainType = Infer<typeof BaseTerrain>;

export class TerrainManager {
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: BaseTerrainType[] = [];
  private worldId: string;
  private detailObjects: Map<string, TerrainDetailObject> = new Map();
  private detailObjectsByPosition: (TerrainDetailObject | null)[][] = [];
  private detailAtlasCanvas: HTMLCanvasElement | null = null;
  private detailAtlasCtx: CanvasRenderingContext2D | null = null;
  private detailAtlasLogicalWidth: number = 0;
  private detailAtlasLogicalHeight: number = 0;
  private detailAtlasNeedsUpdate: boolean = true;
  private atlasInitialized: boolean = false;
  private terrainDebrisParticles: TerrainDebrisParticlesManager = new TerrainDebrisParticlesManager();

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
    this.initializeAtlasCanvases();
  }

  private initializeAtlasCanvases() {
    if (this.worldWidth === 0 || this.worldHeight === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const atlasWidth = (this.worldWidth + 2) * UNIT_TO_PIXEL;
    const atlasHeight = (this.worldHeight + 2) * UNIT_TO_PIXEL;

    this.detailAtlasLogicalWidth = atlasWidth;
    this.detailAtlasLogicalHeight = atlasHeight;

    this.detailAtlasCanvas = document.createElement('canvas');
    this.detailAtlasCanvas.width = atlasWidth * dpr;
    this.detailAtlasCanvas.height = atlasHeight * dpr;
    this.detailAtlasCtx = this.detailAtlasCanvas.getContext('2d');

    if (this.detailAtlasCtx) {
      this.detailAtlasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    this.detailAtlasNeedsUpdate = true;
  }

  private updateDetailAtlas() {
    if (!this.detailAtlasCtx) return;
    if (!this.detailAtlasNeedsUpdate) return;

    this.detailAtlasCtx.clearRect(0, 0, this.detailAtlasLogicalWidth, this.detailAtlasLogicalHeight);

    this.detailAtlasCtx.save();
    this.detailAtlasCtx.translate(UNIT_TO_PIXEL, UNIT_TO_PIXEL);

    for (const obj of this.detailObjects.values()) {
      obj.drawShadow(this.detailAtlasCtx);
    }

    for (const obj of this.detailObjects.values()) {
      obj.drawBody(this.detailAtlasCtx);
    }

    this.detailAtlasCtx.restore();

    this.detailAtlasNeedsUpdate = false;
    this.atlasInitialized = true;
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
      if (this.atlasInitialized) {
        this.detailAtlasNeedsUpdate = true;
      }
    });

    connection.db.terrainDetail.onUpdate((_ctx: EventContext, _oldDetail: Infer<typeof TerrainDetailRow>, newDetail: Infer<typeof TerrainDetailRow>) => {
      const existingObj = this.detailObjects.get(newDetail.id);
      if (existingObj) {
        existingObj.setData(newDetail);
      } else {
        this.createDetailObject(newDetail);
      }
      this.detailAtlasNeedsUpdate = true;
    });

    connection.db.terrainDetail.onDelete((_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
      const obj = this.detailObjects.get(detail.id);
      if (obj) {
        const x = Math.floor(obj.getX());
        const y = Math.floor(obj.getY());
        if (y >= 0 && y < this.worldHeight && x >= 0 && x < this.worldWidth) {
          this.detailObjectsByPosition[y][x] = null;
        }
        
        if (detail.type.tag === "FenceEdge" || detail.type.tag === "FenceCorner") {
          this.terrainDebrisParticles.spawnParticles(detail.positionX, detail.positionY);
        }
      }
      this.detailObjects.delete(detail.id);
      this.detailAtlasNeedsUpdate = true;
    });
  }

  public update(deltaTime: number) {
    for (const obj of this.detailObjects.values()) {
      const hadFlash = obj.getFlashTimer() > 0;
      obj.update(deltaTime);
      const hasFlash = obj.getFlashTimer() > 0;
      
      if (hadFlash && !hasFlash) {
        this.detailAtlasNeedsUpdate = true;
      }
    }
    
    this.terrainDebrisParticles.update(deltaTime);
  }

  private createDetailObject(detail: Infer<typeof TerrainDetailRow>) {
    let obj: TerrainDetailObject | null = null;
    const { positionX: x, positionY: y, label, health, rotation, type } = detail;

    switch (type.tag) {
      case "Rock":
        obj = new Rock(x, y, label, health, rotation);
        break;
      case "Tree":
        obj = new Tree(x, y, label, health, rotation);
        break;
      case "HayBale":
        obj = new HayBale(x, y, label, health, rotation);
        break;
      case "Label":
        obj = new Label(x, y, label, health, rotation);
        break;
      case "FoundationEdge":
        obj = new FoundationEdge(x, y, label, health, rotation);
        break;
      case "FoundationCorner":
        obj = new FoundationCorner(x, y, label, health, rotation);
        break;
      case "FenceEdge":
        obj = new FenceEdge(x, y, label, health, rotation);
        break;
      case "FenceCorner":
        obj = new FenceCorner(x, y, label, health, rotation);
        break;
      case "TargetDummy":
        obj = new TargetDummy(x, y, label, health, rotation);
        break;
    }

    if (obj) {
      this.detailObjects.set(detail.id, obj);
      const x = Math.floor(obj.getX());
      const y = Math.floor(obj.getY());
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

        const worldX = tileX * unitToPixel;
        const worldY = tileY * unitToPixel;

        ctx.fillStyle = this.getBaseTerrainColor(terrain);
        ctx.fillRect(worldX, worldY, unitToPixel, unitToPixel);

        if (terrain.tag === "Farm") {
          ctx.fillStyle = "#313148";
          const numGrooves = 2;
          const grooveHeight = unitToPixel * 0.15;

          for (let i = 0; i < numGrooves; i++) {
            const grooveY = worldY + unitToPixel * ((i + 0.5) / numGrooves) - grooveHeight / 2;
            ctx.fillRect(worldX, grooveY, unitToPixel, grooveHeight);
          }
        }

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
    if (!this.detailAtlasCanvas || !this.detailAtlasCtx) return;

    this.updateDetailAtlas();

    const dpr = window.devicePixelRatio || 1;
    const startTileX = Math.max(0, Math.floor(cameraX / unitToPixel));
    const endTileX = Math.min(this.worldWidth - 1, Math.ceil((cameraX + canvasWidth) / unitToPixel));
    const startTileY = Math.max(0, Math.floor(cameraY / unitToPixel));
    const endTileY = Math.min(this.worldHeight - 1, Math.ceil((cameraY + canvasHeight) / unitToPixel));

    const sourceX = startTileX * unitToPixel;
    const sourceY = startTileY * unitToPixel;
    const sourceWidth = Math.min(
      (endTileX - startTileX + 1) * unitToPixel + 2 * unitToPixel,
      this.detailAtlasLogicalWidth - sourceX
    );
    const sourceHeight = Math.min(
      (endTileY - startTileY + 1) * unitToPixel + 2 * unitToPixel,
      this.detailAtlasLogicalHeight - sourceY
    );

    const destX = startTileX * unitToPixel - unitToPixel;
    const destY = startTileY * unitToPixel - unitToPixel;

    if (sourceWidth > 0 && sourceHeight > 0) {
      ctx.drawImage(
        this.detailAtlasCanvas,
        sourceX * dpr,
        sourceY * dpr,
        sourceWidth * dpr,
        sourceHeight * dpr,
        destX,
        destY,
        sourceWidth,
        sourceHeight
      );
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
    const startTileX = Math.max(0, Math.floor(cameraX / unitToPixel));
    const endTileX = Math.min(this.worldWidth - 1, Math.ceil((cameraX + canvasWidth) / unitToPixel));
    const startTileY = Math.max(0, Math.floor(cameraY / unitToPixel));
    const endTileY = Math.min(this.worldHeight - 1, Math.ceil((cameraY + canvasHeight) / unitToPixel));

    for (const obj of this.detailObjects.values()) {
      if (obj.getFlashTimer() > 0) {
        const objX = obj.getX();
        const objY = obj.getY();
        if (objX >= startTileX && objX <= endTileX && objY >= startTileY && objY <= endTileY) {
          obj.drawBody(ctx);
        }
      }
    }
  }

  public drawParticles(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    this.terrainDebrisParticles.draw(ctx, cameraX, cameraY, viewportWidth, viewportHeight);
  }

  private getBaseTerrainColor(terrain: BaseTerrainType): string {
    switch (terrain.tag) {
      case "Ground":
        return "#2e2e43";
      case "Farm":
        return "#2e2e43";
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
