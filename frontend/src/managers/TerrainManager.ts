import { getConnection } from "../spacetimedb-connection";
import { TerrainDetailManager } from "./TerrainDetailManager";
import { SoundManager } from "./SoundManager";
import { type EventContext, BaseTerrain } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import WorldRow from "../../module_bindings/world_type";
import { UNIT_TO_PIXEL } from "../constants";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";
import { drawBaseTerrain } from "../drawing/terrain/base-terrain";

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
    }
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

    drawBaseTerrain(
      ctx,
      this.baseTerrainLayer,
      this.worldWidth,
      this.worldHeight,
      startTileX,
      endTileX,
      startTileY,
      endTileY
    );
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
