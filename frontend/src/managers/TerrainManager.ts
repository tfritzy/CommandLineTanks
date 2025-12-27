import { getConnection } from "../spacetimedb-connection";
import { BaseTerrainManager } from "./BaseTerrainManager";
import { TerrainDetailManager } from "./TerrainDetailManager";
import { type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import WorldRow from "../../module_bindings/world_type";

export class TerrainManager {
  private baseTerrainManager: BaseTerrainManager;
  private detailManager: TerrainDetailManager | null = null;
  private worldId: string;
  private handleWorldInsert: ((ctx: EventContext, world: Infer<typeof WorldRow>) => void) | null = null;
  private handleWorldUpdate: ((ctx: EventContext, oldWorld: Infer<typeof WorldRow>, newWorld: Infer<typeof WorldRow>) => void) | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.baseTerrainManager = new BaseTerrainManager();
    this.subscribeToWorldForDetails();
  }

  private subscribeToWorldForDetails() {
    const connection = getConnection();
    if (!connection) return;

    this.handleWorldInsert = (_ctx: EventContext, world: Infer<typeof WorldRow>) => {
      this.baseTerrainManager.updateWorld(world.width, world.height, world.baseTerrainLayer);
      
      if (!this.detailManager) {
        this.detailManager = new TerrainDetailManager(
          this.worldId,
          world.width,
          world.height
        );
      } else {
        this.detailManager.updateWorldDimensions(world.width, world.height);
      }
    };

    this.handleWorldUpdate = (_ctx: EventContext, _oldWorld: Infer<typeof WorldRow>, newWorld: Infer<typeof WorldRow>) => {
      this.baseTerrainManager.updateWorld(newWorld.width, newWorld.height, newWorld.baseTerrainLayer);
      
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
    };

    connection.db.world.onInsert(this.handleWorldInsert);
    connection.db.world.onUpdate(this.handleWorldUpdate);
  }

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handleWorldInsert) connection.db.world.removeOnInsert(this.handleWorldInsert);
      if (this.handleWorldUpdate) connection.db.world.removeOnUpdate(this.handleWorldUpdate);
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

  public getBaseTerrainLayer() {
    return this.baseTerrainManager.getBaseTerrainLayer();
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
