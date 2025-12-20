import { getConnection } from "./spacetimedb-connection";
import { BaseTerrain, type TerrainDetailRow, type EventContext } from "../module_bindings";
import { type Infer } from "spacetimedb";
import { TerrainDetailObject } from "./objects/TerrainDetailObject";
import { Cliff, Rock, Tree, Bridge, HayBale, Label, FoundationEdge, FoundationCorner, FenceEdge, FenceCorner, DeadTank, TargetDummy } from "./objects/TerrainDetails";
import { UNIT_TO_PIXEL } from "./game";

type BaseTerrainType = Infer<typeof BaseTerrain>;




export class TerrainManager {
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: BaseTerrainType[] = [];
  private worldId: string;
  private detailObjects: Map<string, TerrainDetailObject> = new Map();
  private detailObjectsByPosition: (TerrainDetailObject | null)[][] = [];
  private shadowAtlasCanvas: HTMLCanvasElement | null = null;
  private shadowAtlasCtx: CanvasRenderingContext2D | null = null;
  private bodyAtlasCanvas: HTMLCanvasElement | null = null;
  private bodyAtlasCtx: CanvasRenderingContext2D | null = null;
  private shadowAtlasNeedsUpdate: boolean = true;
  private bodyAtlasNeedsUpdate: boolean = true;
  private dirtyDetailIds: Set<string> = new Set();

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

    const atlasWidth = this.worldWidth * UNIT_TO_PIXEL;
    const atlasHeight = this.worldHeight * UNIT_TO_PIXEL;

    this.shadowAtlasCanvas = document.createElement('canvas');
    this.shadowAtlasCanvas.width = atlasWidth;
    this.shadowAtlasCanvas.height = atlasHeight;
    this.shadowAtlasCtx = this.shadowAtlasCanvas.getContext('2d');

    this.bodyAtlasCanvas = document.createElement('canvas');
    this.bodyAtlasCanvas.width = atlasWidth;
    this.bodyAtlasCanvas.height = atlasHeight;
    this.bodyAtlasCtx = this.bodyAtlasCanvas.getContext('2d');

    this.shadowAtlasNeedsUpdate = true;
    this.bodyAtlasNeedsUpdate = true;
  }

  private updateShadowAtlas() {
    if (!this.shadowAtlasCtx) return;
    if (!this.shadowAtlasNeedsUpdate) return;

    if (this.dirtyDetailIds.size === 0) {
      this.shadowAtlasCtx.clearRect(0, 0, this.shadowAtlasCanvas!.width, this.shadowAtlasCanvas!.height);
      for (const obj of this.detailObjects.values()) {
        obj.drawShadow(this.shadowAtlasCtx);
      }
    } else {
      for (const detailId of this.dirtyDetailIds) {
        const obj = this.detailObjects.get(detailId);
        if (obj) {
          const worldX = (obj.getX() - 0.5) * UNIT_TO_PIXEL;
          const worldY = (obj.getY() - 0.5) * UNIT_TO_PIXEL;
          const clearSize = UNIT_TO_PIXEL * 2;
          this.shadowAtlasCtx.clearRect(
            worldX - UNIT_TO_PIXEL * 0.5,
            worldY - UNIT_TO_PIXEL * 0.5,
            clearSize,
            clearSize
          );
          obj.drawShadow(this.shadowAtlasCtx);
        }
      }
    }

    this.shadowAtlasNeedsUpdate = false;
  }

  private updateBodyAtlas() {
    if (!this.bodyAtlasCtx) return;
    if (!this.bodyAtlasNeedsUpdate) return;

    if (this.dirtyDetailIds.size === 0) {
      this.bodyAtlasCtx.clearRect(0, 0, this.bodyAtlasCanvas!.width, this.bodyAtlasCanvas!.height);
      for (const obj of this.detailObjects.values()) {
        obj.drawBody(this.bodyAtlasCtx);
      }
    } else {
      for (const detailId of this.dirtyDetailIds) {
        const obj = this.detailObjects.get(detailId);
        if (obj) {
          const worldX = (obj.getX() - 0.5) * UNIT_TO_PIXEL;
          const worldY = (obj.getY() - 0.5) * UNIT_TO_PIXEL;
          const clearSize = UNIT_TO_PIXEL * 2;
          this.bodyAtlasCtx.clearRect(
            worldX - UNIT_TO_PIXEL * 0.5,
            worldY - UNIT_TO_PIXEL * 0.5,
            clearSize,
            clearSize
          );
          obj.drawBody(this.bodyAtlasCtx);
        }
      }
    }

    this.bodyAtlasNeedsUpdate = false;
    this.dirtyDetailIds.clear();
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
      this.dirtyDetailIds.add(detail.id);
      this.shadowAtlasNeedsUpdate = true;
      this.bodyAtlasNeedsUpdate = true;
    });

    connection.db.terrainDetail.onUpdate((_ctx: EventContext, _oldDetail: Infer<typeof TerrainDetailRow>, newDetail: Infer<typeof TerrainDetailRow>) => {
      const existingObj = this.detailObjects.get(newDetail.id);
      if (existingObj) {
        existingObj.setData(newDetail);
      } else {
        this.createDetailObject(newDetail);
      }
      this.dirtyDetailIds.add(newDetail.id);
      this.shadowAtlasNeedsUpdate = true;
      this.bodyAtlasNeedsUpdate = true;
    });

    connection.db.terrainDetail.onDelete((_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
      const obj = this.detailObjects.get(detail.id);
      if (obj) {
        const x = obj.getX();
        const y = obj.getY();
        if (y >= 0 && y < this.worldHeight && x >= 0 && x < this.worldWidth) {
          this.detailObjectsByPosition[y][x] = null;
        }
        const worldX = (x - 0.5) * UNIT_TO_PIXEL;
        const worldY = (y - 0.5) * UNIT_TO_PIXEL;
        const clearSize = UNIT_TO_PIXEL * 2;
        if (this.shadowAtlasCtx) {
          this.shadowAtlasCtx.clearRect(
            worldX - UNIT_TO_PIXEL * 0.5,
            worldY - UNIT_TO_PIXEL * 0.5,
            clearSize,
            clearSize
          );
        }
        if (this.bodyAtlasCtx) {
          this.bodyAtlasCtx.clearRect(
            worldX - UNIT_TO_PIXEL * 0.5,
            worldY - UNIT_TO_PIXEL * 0.5,
            clearSize,
            clearSize
          );
        }
      }
      this.detailObjects.delete(detail.id);
    });
  }

  public update(deltaTime: number) {
    for (const [detailId, obj] of this.detailObjects.entries()) {
      const hadFlash = obj.getFlashTimer() > 0;
      obj.update(deltaTime);
      const hasFlash = obj.getFlashTimer() > 0;
      if (hadFlash || hasFlash) {
        this.dirtyDetailIds.add(detailId);
        this.shadowAtlasNeedsUpdate = true;
        this.bodyAtlasNeedsUpdate = true;
      }
    }
  }

  private createDetailObject(detail: Infer<typeof TerrainDetailRow>) {
    let obj: TerrainDetailObject | null = null;
    const { positionX: x, positionY: y, label, health, rotation, renderOffset, type } = detail;

    switch (type.tag) {
      case "Cliff":
        obj = new Cliff(x, y, label, health, rotation, renderOffset);
        break;
      case "Rock":
        obj = new Rock(x, y, label, health, rotation, renderOffset);
        break;
      case "Tree":
        obj = new Tree(x, y, label, health, rotation, renderOffset);
        break;
      case "Bridge":
        obj = new Bridge(x, y, label, health, rotation, renderOffset);
        break;
      case "HayBale":
        obj = new HayBale(x, y, label, health, rotation, renderOffset);
        break;
      case "Label":
        obj = new Label(x, y, label, health, rotation, renderOffset);
        break;
      case "FoundationEdge":
        obj = new FoundationEdge(x, y, label, health, rotation, renderOffset);
        break;
      case "FoundationCorner":
        obj = new FoundationCorner(x, y, label, health, rotation, renderOffset);
        break;
      case "FenceEdge":
        obj = new FenceEdge(x, y, label, health, rotation, renderOffset);
        break;
      case "FenceCorner":
        obj = new FenceCorner(x, y, label, health, rotation, renderOffset);
        break;
      case "DeadTank":
        obj = new DeadTank(x, y, label, health, rotation, renderOffset);
        break;
      case "TargetDummy":
        obj = new TargetDummy(x, y, label, health, rotation, renderOffset);
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

  private getTerrainAt(x: number, y: number): BaseTerrainType | null {
    if (x < 0 || x >= this.worldWidth || y < 0 || y >= this.worldHeight) {
      return null;
    }
    const index = y * this.worldWidth + x;
    return this.baseTerrainLayer[index];
  }

  private shouldRenderTransition(currentTerrain: BaseTerrainType, neighborTerrain: BaseTerrainType | null): boolean {
    if (!neighborTerrain) return false;
    if (currentTerrain.tag === neighborTerrain.tag) return false;
    if (currentTerrain.tag === "Ground") return false;
    if (currentTerrain.tag === "Road" && neighborTerrain.tag === "Stream") return false;
    return true;
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

        if (terrain.tag === "Farm") {
          ctx.fillStyle = "#313148";
          const numGrooves = 2;
          const grooveHeight = unitToPixel * 0.15;

          for (let i = 0; i < numGrooves; i++) {
            const grooveY = worldY + unitToPixel * ((i + 0.5) / numGrooves) - grooveHeight / 2;
            ctx.fillRect(worldX, grooveY, unitToPixel, grooveHeight);
          }
        }

        this.drawOffsetTile(ctx, tileX, tileY, terrain, worldX, worldY, unitToPixel);

        ctx.strokeStyle = "#4a4b5b22";
        ctx.lineWidth = 1;
        ctx.strokeRect(worldX, worldY, unitToPixel, unitToPixel);
      }
    }
  }

  private drawOffsetTile(
    ctx: CanvasRenderingContext2D,
    tileX: number,
    tileY: number,
    terrain: BaseTerrainType,
    worldX: number,
    worldY: number,
    unitToPixel: number
  ) {
    if (terrain.tag === "Ground" || terrain.tag === "Farm") {
      return;
    }

    const north = this.getTerrainAt(tileX, tileY - 1);
    const south = this.getTerrainAt(tileX, tileY + 1);
    const east = this.getTerrainAt(tileX + 1, tileY);
    const west = this.getTerrainAt(tileX - 1, tileY);
    const northEast = this.getTerrainAt(tileX + 1, tileY - 1);
    const northWest = this.getTerrainAt(tileX - 1, tileY - 1);
    const southEast = this.getTerrainAt(tileX + 1, tileY + 1);
    const southWest = this.getTerrainAt(tileX - 1, tileY + 1);

    const groundColor = this.getBaseTerrainColor({ tag: "Ground" } as BaseTerrainType);
    const edgeSize = unitToPixel * 0.25;
    const cornerSize = unitToPixel * 0.35;

    ctx.fillStyle = groundColor;

    if (this.shouldRenderTransition(terrain, north)) {
      ctx.beginPath();
      ctx.moveTo(worldX, worldY);
      ctx.lineTo(worldX + unitToPixel, worldY);
      ctx.lineTo(worldX + unitToPixel, worldY + edgeSize);
      ctx.lineTo(worldX, worldY + edgeSize);
      ctx.closePath();
      ctx.fill();
    }

    if (this.shouldRenderTransition(terrain, south)) {
      ctx.beginPath();
      ctx.moveTo(worldX, worldY + unitToPixel - edgeSize);
      ctx.lineTo(worldX + unitToPixel, worldY + unitToPixel - edgeSize);
      ctx.lineTo(worldX + unitToPixel, worldY + unitToPixel);
      ctx.lineTo(worldX, worldY + unitToPixel);
      ctx.closePath();
      ctx.fill();
    }

    if (this.shouldRenderTransition(terrain, west)) {
      ctx.beginPath();
      ctx.moveTo(worldX, worldY);
      ctx.lineTo(worldX + edgeSize, worldY);
      ctx.lineTo(worldX + edgeSize, worldY + unitToPixel);
      ctx.lineTo(worldX, worldY + unitToPixel);
      ctx.closePath();
      ctx.fill();
    }

    if (this.shouldRenderTransition(terrain, east)) {
      ctx.beginPath();
      ctx.moveTo(worldX + unitToPixel - edgeSize, worldY);
      ctx.lineTo(worldX + unitToPixel, worldY);
      ctx.lineTo(worldX + unitToPixel, worldY + unitToPixel);
      ctx.lineTo(worldX + unitToPixel - edgeSize, worldY + unitToPixel);
      ctx.closePath();
      ctx.fill();
    }

    if (this.shouldRenderTransition(terrain, northWest) && !this.shouldRenderTransition(terrain, north) && !this.shouldRenderTransition(terrain, west)) {
      ctx.beginPath();
      ctx.moveTo(worldX, worldY);
      ctx.lineTo(worldX + cornerSize, worldY);
      ctx.arc(worldX + cornerSize, worldY + cornerSize, cornerSize, -Math.PI / 2, Math.PI, true);
      ctx.lineTo(worldX, worldY + cornerSize);
      ctx.closePath();
      ctx.fill();
    }

    if (this.shouldRenderTransition(terrain, northEast) && !this.shouldRenderTransition(terrain, north) && !this.shouldRenderTransition(terrain, east)) {
      ctx.beginPath();
      ctx.moveTo(worldX + unitToPixel, worldY);
      ctx.lineTo(worldX + unitToPixel - cornerSize, worldY);
      ctx.arc(worldX + unitToPixel - cornerSize, worldY + cornerSize, cornerSize, -Math.PI / 2, 0, false);
      ctx.lineTo(worldX + unitToPixel, worldY + cornerSize);
      ctx.closePath();
      ctx.fill();
    }

    if (this.shouldRenderTransition(terrain, southWest) && !this.shouldRenderTransition(terrain, south) && !this.shouldRenderTransition(terrain, west)) {
      ctx.beginPath();
      ctx.moveTo(worldX, worldY + unitToPixel);
      ctx.lineTo(worldX, worldY + unitToPixel - cornerSize);
      ctx.arc(worldX + cornerSize, worldY + unitToPixel - cornerSize, cornerSize, Math.PI, Math.PI / 2, true);
      ctx.lineTo(worldX + cornerSize, worldY + unitToPixel);
      ctx.closePath();
      ctx.fill();
    }

    if (this.shouldRenderTransition(terrain, southEast) && !this.shouldRenderTransition(terrain, south) && !this.shouldRenderTransition(terrain, east)) {
      ctx.beginPath();
      ctx.moveTo(worldX + unitToPixel, worldY + unitToPixel);
      ctx.lineTo(worldX + unitToPixel, worldY + unitToPixel - cornerSize);
      ctx.arc(worldX + unitToPixel - cornerSize, worldY + unitToPixel - cornerSize, cornerSize, 0, Math.PI / 2, false);
      ctx.lineTo(worldX + unitToPixel - cornerSize, worldY + unitToPixel);
      ctx.closePath();
      ctx.fill();
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
    if (!this.shadowAtlasCanvas || !this.shadowAtlasCtx) return;

    this.updateShadowAtlas();

    const startTileX = Math.max(0, Math.floor(cameraX / unitToPixel));
    const endTileX = Math.min(this.worldWidth - 1, Math.ceil((cameraX + canvasWidth) / unitToPixel));
    const startTileY = Math.max(0, Math.floor(cameraY / unitToPixel));
    const endTileY = Math.min(this.worldHeight - 1, Math.ceil((cameraY + canvasHeight) / unitToPixel));

    const atlasTileWidth = endTileX - startTileX + 1;
    const atlasTileHeight = endTileY - startTileY + 1;

    if (atlasTileWidth > 0 && atlasTileHeight > 0) {
      ctx.drawImage(
        this.shadowAtlasCanvas,
        startTileX * unitToPixel,
        startTileY * unitToPixel,
        atlasTileWidth * unitToPixel,
        atlasTileHeight * unitToPixel,
        startTileX * unitToPixel,
        startTileY * unitToPixel,
        atlasTileWidth * unitToPixel,
        atlasTileHeight * unitToPixel
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
    if (!this.bodyAtlasCanvas || !this.bodyAtlasCtx) return;

    this.updateBodyAtlas();

    const startTileX = Math.max(0, Math.floor(cameraX / unitToPixel));
    const endTileX = Math.min(this.worldWidth - 1, Math.ceil((cameraX + canvasWidth) / unitToPixel));
    const startTileY = Math.max(0, Math.floor(cameraY / unitToPixel));
    const endTileY = Math.min(this.worldHeight - 1, Math.ceil((cameraY + canvasHeight) / unitToPixel));

    const atlasTileWidth = endTileX - startTileX + 1;
    const atlasTileHeight = endTileY - startTileY + 1;

    if (atlasTileWidth > 0 && atlasTileHeight > 0) {
      ctx.drawImage(
        this.bodyAtlasCanvas,
        startTileX * unitToPixel,
        startTileY * unitToPixel,
        atlasTileWidth * unitToPixel,
        atlasTileHeight * unitToPixel,
        startTileX * unitToPixel,
        startTileY * unitToPixel,
        atlasTileWidth * unitToPixel,
        atlasTileHeight * unitToPixel
      );
    }
  }

  private getBaseTerrainColor(terrain: BaseTerrainType): string {
    switch (terrain.tag) {
      case "Ground":
        return "#2e2e43";
      case "Stream":
        return "#3e4c7e";
      case "Road":
        return "#405967";
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
