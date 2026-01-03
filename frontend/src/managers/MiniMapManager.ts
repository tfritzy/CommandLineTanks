import { TankManager } from "./TankManager";
import { TERRAIN_COLORS, TERRAIN_DETAIL_COLORS, TEAM_COLORS } from "../constants";
import { getConnection } from "../spacetimedb-connection";
import { type EventContext, type TerrainDetailRow } from "../../module_bindings";
import WorldRow from "../../module_bindings/world_type";
import { type Infer } from "spacetimedb";
import { BaseTerrain } from "../../module_bindings";

type BaseTerrainType = Infer<typeof BaseTerrain>;

export class MiniMapManager {
  private tankManager: TankManager;
  private worldId: string;
  private miniMapMaxSize: number = 150;
  private margin: number = 20;
  private tankIndicatorSize: number = 5;
  private spawnZoneWidth: number = 5;
  private baseLayerCanvas: HTMLCanvasElement | null = null;
  private baseLayerContext: CanvasRenderingContext2D | null = null;
  private lastWorldWidth: number = 0;
  private lastWorldHeight: number = 0;
  private needsRedraw: boolean = true;
  private lastDpr: number = 0;
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: BaseTerrainType[] = [];
  private terrainDetailsByPosition: Map<string, Infer<typeof TerrainDetailRow>> = new Map();
  private handleWorldInsert: ((ctx: EventContext, world: Infer<typeof WorldRow>) => void) | null = null;
  private handleWorldUpdate: ((ctx: EventContext, oldWorld: Infer<typeof WorldRow>, newWorld: Infer<typeof WorldRow>) => void) | null = null;
  private handleDetailInsert: ((ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => void) | null = null;
  private handleDetailDelete: ((ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => void) | null = null;

  constructor(tankManager: TankManager, worldId: string) {
    this.tankManager = tankManager;
    this.worldId = worldId;
    this.subscribeToWorld();
    this.subscribeToTerrainDetails();
  }

  private getPositionKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private subscribeToWorld() {
    const connection = getConnection();
    if (!connection) return;

    this.handleWorldInsert = (_ctx: EventContext, world: Infer<typeof WorldRow>) => {
      if (world.id !== this.worldId) return;
      this.worldWidth = world.width;
      this.worldHeight = world.height;
      this.baseTerrainLayer = world.baseTerrainLayer;
      this.markForRedraw();
    };

    this.handleWorldUpdate = (_ctx: EventContext, _oldWorld: Infer<typeof WorldRow>, newWorld: Infer<typeof WorldRow>) => {
      if (newWorld.id !== this.worldId) return;
      this.worldWidth = newWorld.width;
      this.worldHeight = newWorld.height;
      this.baseTerrainLayer = newWorld.baseTerrainLayer;
      this.markForRedraw();
    };

    connection.db.world.onInsert(this.handleWorldInsert);
    connection.db.world.onUpdate(this.handleWorldUpdate);

    const cachedWorld = connection.db.world.Id.find(this.worldId);
    if (cachedWorld) {
      this.worldWidth = cachedWorld.width;
      this.worldHeight = cachedWorld.height;
      this.baseTerrainLayer = cachedWorld.baseTerrainLayer;
    }
  }

  private subscribeToTerrainDetails() {
    const connection = getConnection();
    if (!connection) return;

    this.handleDetailInsert = (_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
      if (detail.worldId !== this.worldId) return;
      const key = this.getPositionKey(detail.positionX, detail.positionY);
      this.terrainDetailsByPosition.set(key, detail);
      this.markForRedraw();
    };

    this.handleDetailDelete = (_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => {
      if (detail.worldId !== this.worldId) return;
      const key = this.getPositionKey(detail.positionX, detail.positionY);
      this.terrainDetailsByPosition.delete(key);
      this.markForRedraw();
    };

    connection.db.terrainDetail.onInsert(this.handleDetailInsert);
    connection.db.terrainDetail.onDelete(this.handleDetailDelete);

    for (const detail of connection.db.terrainDetail.iter()) {
      if (detail.worldId === this.worldId) {
        const key = this.getPositionKey(detail.positionX, detail.positionY);
        this.terrainDetailsByPosition.set(key, detail);
      }
    }
  }

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handleWorldInsert) connection.db.world.removeOnInsert(this.handleWorldInsert);
      if (this.handleWorldUpdate) connection.db.world.removeOnUpdate(this.handleWorldUpdate);
      if (this.handleDetailInsert) connection.db.terrainDetail.removeOnInsert(this.handleDetailInsert);
      if (this.handleDetailDelete) connection.db.terrainDetail.removeOnDelete(this.handleDetailDelete);
    }
    this.terrainDetailsByPosition.clear();
  }

  public markForRedraw() {
    this.needsRedraw = true;
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    if (this.worldWidth === 0 || this.worldHeight === 0) return;

    const playerTank = this.tankManager.getPlayerTank();
    if (!playerTank) return;

    const dpr = window.devicePixelRatio || 1;
    const aspectRatio = this.worldWidth / this.worldHeight;
    let miniMapWidth: number;
    let miniMapHeight: number;
    
    if (aspectRatio > 1) {
      miniMapWidth = this.miniMapMaxSize;
      miniMapHeight = this.miniMapMaxSize / aspectRatio;
    } else {
      miniMapHeight = this.miniMapMaxSize;
      miniMapWidth = this.miniMapMaxSize * aspectRatio;
    }

    const miniMapX = canvasWidth - miniMapWidth - this.margin;
    const miniMapY = canvasHeight - miniMapHeight - this.margin;

    const worldChanged = this.worldWidth !== this.lastWorldWidth || this.worldHeight !== this.lastWorldHeight;
    const dprChanged = dpr !== this.lastDpr;
    if (worldChanged || dprChanged || this.needsRedraw || !this.baseLayerCanvas) {
      this.createBaseLayer(miniMapWidth, miniMapHeight, this.worldWidth, this.worldHeight, dpr);
      this.lastWorldWidth = this.worldWidth;
      this.lastWorldHeight = this.worldHeight;
      this.lastDpr = dpr;
      this.needsRedraw = false;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (this.baseLayerCanvas) {
      ctx.drawImage(this.baseLayerCanvas, miniMapX, miniMapY, miniMapWidth, miniMapHeight);
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(miniMapX, miniMapY, miniMapWidth, miniMapHeight);

    for (const tank of this.tankManager.getAllTanks()) {
      if (tank.getHealth() <= 0) continue;

      const tankPos = tank.getPosition();
      const clampedX = Math.max(0, Math.min(tankPos.x, this.worldWidth));
      const clampedY = Math.max(0, Math.min(tankPos.y, this.worldHeight));
      const tankX = (clampedX / this.worldWidth) * miniMapWidth;
      const tankY = (clampedY / this.worldHeight) * miniMapHeight;

      const tankColor = tank.getAllianceColor();
      ctx.fillStyle = tankColor;
      ctx.fillRect(
        miniMapX + tankX - this.tankIndicatorSize / 2,
        miniMapY + tankY - this.tankIndicatorSize / 2,
        this.tankIndicatorSize,
        this.tankIndicatorSize
      );
    }

    ctx.restore();
  }

  private createBaseLayer(
    miniMapWidth: number,
    miniMapHeight: number,
    worldWidth: number,
    worldHeight: number,
    dpr: number
  ) {
    if (!this.baseLayerCanvas) {
      this.baseLayerCanvas = document.createElement('canvas');
      this.baseLayerContext = this.baseLayerCanvas.getContext('2d');
      if (this.baseLayerContext) {
        this.baseLayerContext.imageSmoothingEnabled = false;
      }
    }

    if (!this.baseLayerContext) return;

    this.baseLayerCanvas.width = miniMapWidth * dpr;
    this.baseLayerCanvas.height = miniMapHeight * dpr;
    
    this.baseLayerContext.setTransform(1, 0, 0, 1, 0, 0);
    this.baseLayerContext.scale(dpr, dpr);
    this.baseLayerContext.imageSmoothingEnabled = false;

    this.drawTerrain(this.baseLayerContext, 0, 0, miniMapWidth, miniMapHeight, worldWidth, worldHeight);
    this.drawSpawnZones(this.baseLayerContext, 0, 0, miniMapWidth, miniMapHeight, worldWidth, worldHeight);
  }

  private drawTerrain(
    ctx: CanvasRenderingContext2D,
    miniMapX: number,
    miniMapY: number,
    miniMapWidth: number,
    miniMapHeight: number,
    worldWidth: number,
    worldHeight: number
  ) {
    if (!this.baseTerrainLayer || this.baseTerrainLayer.length === 0) return;

    const pixelWidth = miniMapWidth / worldWidth;
    const pixelHeight = miniMapHeight / worldHeight;

    // Fill background
    ctx.fillStyle = TERRAIN_COLORS.GROUND;
    ctx.fillRect(miniMapX, miniMapY, miniMapWidth, miniMapHeight);

    // Draw Farms
    ctx.fillStyle = TERRAIN_COLORS.FARM_GROOVE;
    for (let i = 0; i < this.baseTerrainLayer.length; i++) {
      if (this.baseTerrainLayer[i].tag === "Farm") {
        const tileX = i % worldWidth;
        const tileY = Math.floor(i / worldWidth);
        ctx.fillRect(
          miniMapX + tileX * pixelWidth,
          miniMapY + tileY * pixelHeight,
          Math.ceil(pixelWidth),
          Math.ceil(pixelHeight)
        );
      }
    }

    const detailColorMap: Record<string, string> = {
      Tree: TERRAIN_DETAIL_COLORS.TREE.BASE,
      Rock: TERRAIN_DETAIL_COLORS.ROCK.BODY,
      HayBale: TERRAIN_DETAIL_COLORS.HAY_BALE.BODY,
      FoundationEdge: TERRAIN_DETAIL_COLORS.FOUNDATION.BASE,
      FoundationCorner: TERRAIN_DETAIL_COLORS.FOUNDATION.BASE,
      FenceEdge: TERRAIN_DETAIL_COLORS.FENCE.RAIL,
      FenceCorner: TERRAIN_DETAIL_COLORS.FENCE.RAIL,
      TargetDummy: TERRAIN_DETAIL_COLORS.TARGET_DUMMY.BODY,
      Label: TERRAIN_COLORS.GROUND,
      None: TERRAIN_COLORS.GROUND
    };

    for (const detail of this.terrainDetailsByPosition.values()) {
      const detailType = detail.type.tag;
      const color = detailColorMap[detailType];
      if (color && color !== TERRAIN_COLORS.GROUND) {
        ctx.fillStyle = color;

        let x = miniMapX + detail.positionX * pixelWidth;
        let y = miniMapY + detail.positionY * pixelHeight;
        let w = Math.ceil(pixelWidth);
        let h = Math.ceil(pixelHeight);

        if (
          detailType === "FenceEdge" ||
          detailType === "FenceCorner" ||
          detailType === "FoundationEdge" ||
          detailType === "FoundationCorner"
        ) {
          const newW = Math.max(1, w * 0.25);
          const newH = Math.max(1, h * 0.25);
          x += (w - newW) / 2;
          y += (h - newH) / 2;
          w = newW;
          h = newH;
        }

        ctx.fillRect(x, y, w, h);
      }
    }
  }

  private drawSpawnZones(
    ctx: CanvasRenderingContext2D,
    miniMapX: number,
    miniMapY: number,
    miniMapWidth: number,
    miniMapHeight: number,
    worldWidth: number,
    worldHeight: number
  ) {
    const pixelWidth = miniMapWidth / worldWidth;
    const pixelHeight = miniMapHeight / worldHeight;

    ctx.fillStyle = TEAM_COLORS.RED + "33";
    const redSpawnX = miniMapX;
    const redSpawnY = miniMapY;
    const redSpawnWidth = this.spawnZoneWidth * pixelWidth;
    const redSpawnHeight = worldHeight * pixelHeight;
    ctx.fillRect(redSpawnX, redSpawnY, redSpawnWidth, redSpawnHeight);

    ctx.fillStyle = TEAM_COLORS.BLUE + "33";
    const blueSpawnX = miniMapX + (worldWidth - this.spawnZoneWidth) * pixelWidth;
    const blueSpawnY = miniMapY;
    const blueSpawnWidth = this.spawnZoneWidth * pixelWidth;
    const blueSpawnHeight = worldHeight * pixelHeight;
    ctx.fillRect(blueSpawnX, blueSpawnY, blueSpawnWidth, blueSpawnHeight);
  }
}
