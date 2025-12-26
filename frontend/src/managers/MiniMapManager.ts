import { TankManager } from "./TankManager";
import { TerrainManager } from "./TerrainManager";
import { TERRAIN_COLORS, TERRAIN_DETAIL_COLORS, TEAM_COLORS } from "../constants";

export class MiniMapManager {
  private tankManager: TankManager;
  private terrainManager: TerrainManager;
  private miniMapMaxSize: number = 150;
  private margin: number = 20;
  private tankIndicatorRadius: number = 5;
  private spawnZoneWidth: number = 5;
  private baseLayerCanvas: HTMLCanvasElement | null = null;
  private baseLayerContext: CanvasRenderingContext2D | null = null;
  private lastWorldWidth: number = 0;
  private lastWorldHeight: number = 0;
  private needsRedraw: boolean = true;

  constructor(tankManager: TankManager, terrainManager: TerrainManager) {
    this.tankManager = tankManager;
    this.terrainManager = terrainManager;
    this.subscribeToTerrainChanges();
  }

  private subscribeToTerrainChanges() {
    this.terrainManager.onTerrainDetailDeleted(() => {
      this.markForRedraw();
    });
  }

  public markForRedraw() {
    this.needsRedraw = true;
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    const worldWidth = this.terrainManager.getWorldWidth();
    const worldHeight = this.terrainManager.getWorldHeight();
    
    if (worldWidth === 0 || worldHeight === 0) return;

    const playerTank = this.tankManager.getPlayerTank();
    if (!playerTank) return;

    const aspectRatio = worldWidth / worldHeight;
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

    const worldChanged = worldWidth !== this.lastWorldWidth || worldHeight !== this.lastWorldHeight;
    if (worldChanged || this.needsRedraw || !this.baseLayerCanvas) {
      this.createBaseLayer(miniMapWidth, miniMapHeight, worldWidth, worldHeight);
      this.lastWorldWidth = worldWidth;
      this.lastWorldHeight = worldHeight;
      this.needsRedraw = false;
    }

    ctx.save();

    if (this.baseLayerCanvas) {
      ctx.drawImage(this.baseLayerCanvas, miniMapX, miniMapY);
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(miniMapX, miniMapY, miniMapWidth, miniMapHeight);

    const playerPos = playerTank.getPosition();
    const clampedX = Math.max(0, Math.min(playerPos.x, worldWidth));
    const clampedY = Math.max(0, Math.min(playerPos.y, worldHeight));
    const tankX = (clampedX / worldWidth) * miniMapWidth;
    const tankY = (clampedY / worldHeight) * miniMapHeight;

    const tankColor = playerTank.getAllianceColor();
    ctx.fillStyle = tankColor;
    ctx.beginPath();
    ctx.arc(
      miniMapX + tankX,
      miniMapY + tankY,
      this.tankIndicatorRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  private createBaseLayer(
    miniMapWidth: number,
    miniMapHeight: number,
    worldWidth: number,
    worldHeight: number
  ) {
    if (!this.baseLayerCanvas) {
      this.baseLayerCanvas = document.createElement('canvas');
      this.baseLayerContext = this.baseLayerCanvas.getContext('2d');
    }

    if (!this.baseLayerContext) return;

    this.baseLayerCanvas.width = miniMapWidth;
    this.baseLayerCanvas.height = miniMapHeight;

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
    const baseTerrainLayer = this.terrainManager.getBaseTerrainLayer();
    const terrainDetailsByPosition = this.terrainManager.getTerrainDetailsByPosition();

    if (!baseTerrainLayer || baseTerrainLayer.length === 0) return;

    const pixelWidth = miniMapWidth / worldWidth;
    const pixelHeight = miniMapHeight / worldHeight;

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

    for (let tileY = 0; tileY < worldHeight; tileY++) {
      for (let tileX = 0; tileX < worldWidth; tileX++) {
        const index = tileY * worldWidth + tileX;
        const terrain = baseTerrainLayer[index];

        let color: string;
        if (terrain.tag === "Lake") {
          color = TERRAIN_COLORS.LAKE;
        } else {
          color = TERRAIN_COLORS.GROUND;
        }

        if (terrainDetailsByPosition && tileY < terrainDetailsByPosition.length && tileX < terrainDetailsByPosition[tileY].length) {
          const detail = terrainDetailsByPosition[tileY][tileX];
          if (detail) {
            const detailType = detail.getType();
            const detailColor = detailColorMap[detailType];
            if (detailColor) {
              color = detailColor;
            }
          }
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          miniMapX + tileX * pixelWidth,
          miniMapY + tileY * pixelHeight,
          Math.ceil(pixelWidth),
          Math.ceil(pixelHeight)
        );
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
