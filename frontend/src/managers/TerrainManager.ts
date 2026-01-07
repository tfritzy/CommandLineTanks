import { getConnection } from "../spacetimedb-connection";
import { TerrainDetailManager } from "./TerrainDetailManager";
import { SoundManager } from "./SoundManager";
import { type EventContext, BaseTerrain } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import WorldRow from "../../module_bindings/world_type";
import { UNIT_TO_PIXEL } from "../constants";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import { COLORS } from "../theme/colors";

type BaseTerrainType = Infer<typeof BaseTerrain>;

export class TerrainManager {
  private detailManager: TerrainDetailManager | null = null;
  private worldId: string;
  private worldWidth: number = 0;
  private worldHeight: number = 0;
  private baseTerrainLayer: BaseTerrainType[] = [];
  private soundManager: SoundManager;
  private subscription: TableSubscription<typeof WorldRow> | null = null;

  constructor(worldId: string, soundManager: SoundManager) {
    this.worldId = worldId;
    this.soundManager = soundManager;
    this.subscribeToWorldForDetails();
  }

  private subscribeToWorldForDetails() {
    const connection = getConnection();
    if (!connection) return;

    const handleWorldChange = (world: Infer<typeof WorldRow>) => {
      if (world.id !== this.worldId) return;
      this.worldWidth = world.width;
      this.worldHeight = world.height;
      this.baseTerrainLayer = world.baseTerrainLayer;

      if (!this.detailManager) {
        this.detailManager = new TerrainDetailManager(
          this.worldId,
          world.width,
          world.height,
          this.soundManager
        );
      } else {
        this.detailManager.updateWorldDimensions(world.width, world.height);
      }
    };

    this.subscription = subscribeToTable({
      table: connection.db.world,
      handlers: {
        onInsert: (_ctx: EventContext, world: Infer<typeof WorldRow>) => {
          handleWorldChange(world);
        },
        onUpdate: (_ctx: EventContext, _oldWorld: Infer<typeof WorldRow>, newWorld: Infer<typeof WorldRow>) => {
          handleWorldChange(newWorld);
        }
      },
      loadInitialData: false
    });

    const cachedWorld = connection.db.world.Id.find(this.worldId);
    if (cachedWorld) {
      handleWorldChange(cachedWorld);
    }
  }

  public destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (this.detailManager) {
      this.detailManager.destroy();
      this.detailManager = null;
    }
    this.baseTerrainLayer = [];
  }

  public update(deltaTime: number) {
    if (this.detailManager) {
      this.detailManager.update(deltaTime);
    }
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.baseTerrainLayer.length === 0) return;

    const startTileX = Math.floor(cameraX / UNIT_TO_PIXEL);
    const endTileX = Math.ceil((cameraX + canvasWidth) / UNIT_TO_PIXEL);
    const startTileY = Math.floor(cameraY / UNIT_TO_PIXEL);
    const endTileY = Math.ceil((cameraY + canvasHeight) / UNIT_TO_PIXEL);

    this.drawFarms(ctx, startTileX, endTileX, startTileY, endTileY);
    this.drawGrid(ctx, startTileX, endTileX, startTileY, endTileY);
  }

  private drawFarms(
    ctx: CanvasRenderingContext2D,
    startTileX: number,
    endTileX: number,
    startTileY: number,
    endTileY: number
  ) {
    ctx.fillStyle = COLORS.TERRAIN.FARM_GROOVE;
    const numGrooves = 2;
    const grooveHeight = UNIT_TO_PIXEL * 0.15;

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
          const worldX = tileX * UNIT_TO_PIXEL;
          const worldY = tileY * UNIT_TO_PIXEL;

          for (let i = 0; i < numGrooves; i++) {
            const grooveY =
              worldY +
              UNIT_TO_PIXEL * ((i + 0.5) / numGrooves) -
              grooveHeight / 2;
            ctx.rect(worldX, grooveY, UNIT_TO_PIXEL, grooveHeight);
          }
        }
      }
    }
    ctx.fill();
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    startTileX: number,
    endTileX: number,
    startTileY: number,
    endTileY: number
  ) {
    ctx.fillStyle = COLORS.TERRAIN.CHECKER;
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

        if ((tileX + tileY) % 2 === 0) {
          const worldX = tileX * UNIT_TO_PIXEL;
          const worldY = tileY * UNIT_TO_PIXEL;
          ctx.rect(worldX, worldY, UNIT_TO_PIXEL, UNIT_TO_PIXEL);
        }
      }
    }
    ctx.fill();
  }

  public drawShadows(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.detailManager) {
      this.detailManager.drawShadows(
        ctx,
        cameraX,
        cameraY,
        canvasWidth,
        canvasHeight
      );
    }
  }

  public drawBodies(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.detailManager) {
      this.detailManager.drawBodies(
        ctx,
        cameraX,
        cameraY,
        canvasWidth,
        canvasHeight
      );
    }
  }

  public drawParticles(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    if (this.detailManager) {
      this.detailManager.drawParticles(
        ctx,
        cameraX,
        cameraY,
        viewportWidth,
        viewportHeight
      );
    }
  }

  public drawDecorations(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.detailManager) {
      this.detailManager.drawDecorations(
        ctx,
        cameraX,
        cameraY,
        canvasWidth,
        canvasHeight
      );
    }
  }

  public getWorldWidth(): number {
    return this.worldWidth;
  }

  public getWorldHeight(): number {
    return this.worldHeight;
  }

  public getBaseTerrainLayer() {
    return this.baseTerrainLayer;
  }

  public getTerrainDetailsByPosition() {
    return this.detailManager?.getDetailObjectsByPosition() ?? null;
  }

  public onTerrainDetailDeleted(callback: () => void): void {
    if (this.detailManager) {
      this.detailManager.onDetailDeleted(callback);
    }
  }
}
