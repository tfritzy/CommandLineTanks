import { getConnection } from "../spacetimedb-connection";
import { BaseTerrainManager } from "./BaseTerrainManager";
import { TerrainDetailManager } from "./TerrainDetailManager";

export class TerrainManager {
  private baseTerrainManager: BaseTerrainManager;
  private detailManager: TerrainDetailManager | null = null;
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.baseTerrainManager = new BaseTerrainManager(worldId);
    this.subscribeToWorldForDetails();
  }

  private subscribeToWorldForDetails() {
    const connection = getConnection();
    if (!connection) return;

    connection.db.world.onInsert((_ctx, world) => {
      if (!this.detailManager) {
        this.detailManager = new TerrainDetailManager(
          this.worldId,
          world.width,
          world.height
        );
      } else {
        this.detailManager.updateWorldDimensions(world.width, world.height);
      }
    });

    connection.db.world.onUpdate((_ctx, _oldWorld, newWorld) => {
      if (!this.detailManager) {
        this.detailManager = new TerrainDetailManager(
          this.worldId,
          newWorld.width,
          newWorld.height
        );
      } else {
        this.detailManager.updateWorldDimensions(
          newWorld.width,
          newWorld.height
        );
      }
    });
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
    this.baseTerrainManager.draw(
      ctx,
      cameraX,
      cameraY,
      canvasWidth,
      canvasHeight
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

  public getWorldWidth(): number {
    return this.baseTerrainManager.getWorldWidth();
  }

  public getWorldHeight(): number {
    return this.baseTerrainManager.getWorldHeight();
  }
}
