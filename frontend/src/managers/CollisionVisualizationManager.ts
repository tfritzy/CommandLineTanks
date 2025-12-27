import { getConnection } from "../spacetimedb-connection";
import { type TraversibilityMapRow, type TankRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "../constants";

const COLLISION_REGION_SIZE = 4;

export class CollisionVisualizationManager {
  private worldId: string;
  private traversibilityMap: boolean[] = [];
  private mapWidth: number = 0;
  private mapHeight: number = 0;
  private tanks: Map<string, Infer<typeof TankRow>> = new Map();
  private handleMapInsert: ((ctx: EventContext, map: Infer<typeof TraversibilityMapRow>) => void) | null = null;
  private handleMapUpdate: ((ctx: EventContext, oldMap: Infer<typeof TraversibilityMapRow>, newMap: Infer<typeof TraversibilityMapRow>) => void) | null = null;
  private handleTankInsert: ((ctx: EventContext, tank: Infer<typeof TankRow>) => void) | null = null;
  private handleTankUpdate: ((ctx: EventContext, oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => void) | null = null;
  private handleTankDelete: ((ctx: EventContext, tank: Infer<typeof TankRow>) => void) | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToTraversibilityMap();
    this.subscribeToTanks();
  }

  private subscribeToTraversibilityMap() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("CollisionVisualizationManager traversibility subscription error", e))
      .subscribe([`SELECT * FROM traversibility_map WHERE WorldId = '${this.worldId}'`]);

    this.handleMapInsert = (_ctx: EventContext, map: Infer<typeof TraversibilityMapRow>) => {
      if (map.worldId !== this.worldId) return;
      this.traversibilityMap = map.map;
      this.mapWidth = map.width;
      this.mapHeight = map.height;
    };

    this.handleMapUpdate = (_ctx: EventContext, _oldMap: Infer<typeof TraversibilityMapRow>, newMap: Infer<typeof TraversibilityMapRow>) => {
      if (newMap.worldId !== this.worldId) return;
      this.traversibilityMap = newMap.map;
      this.mapWidth = newMap.width;
      this.mapHeight = newMap.height;
    };

    connection.db.traversibilityMap.onInsert(this.handleMapInsert);
    connection.db.traversibilityMap.onUpdate(this.handleMapUpdate);

    const cachedMap = connection.db.traversibilityMap.WorldId.find(this.worldId);
    if (cachedMap) {
      this.traversibilityMap = cachedMap.map;
      this.mapWidth = cachedMap.width;
      this.mapHeight = cachedMap.height;
    }
  }

  private subscribeToTanks() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("CollisionVisualizationManager tank subscription error", e))
      .subscribe([`SELECT * FROM tank WHERE WorldId = '${this.worldId}'`]);

    this.handleTankInsert = (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      if (tank.worldId !== this.worldId) return;
      this.tanks.set(tank.id, tank);
    };

    this.handleTankUpdate = (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
      if (newTank.worldId !== this.worldId) return;
      this.tanks.set(newTank.id, newTank);
    };

    this.handleTankDelete = (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
      if (tank.worldId !== this.worldId) return;
      this.tanks.delete(tank.id);
    };

    connection.db.tank.onInsert(this.handleTankInsert);
    connection.db.tank.onUpdate(this.handleTankUpdate);
    connection.db.tank.onDelete(this.handleTankDelete);

    for (const tank of connection.db.tank.iter()) {
      if (tank.worldId === this.worldId) {
        this.tanks.set(tank.id, tank);
      }
    }
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    this.drawNonTraversableTiles(ctx, cameraX, cameraY, canvasWidth, canvasHeight);
    this.drawCollisionRegions(ctx, cameraX, cameraY, canvasWidth, canvasHeight);
  }

  private drawNonTraversableTiles(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.traversibilityMap.length === 0 || this.mapWidth === 0 || this.mapHeight === 0) {
      return;
    }

    const startTileX = Math.max(0, Math.floor(cameraX / UNIT_TO_PIXEL));
    const endTileX = Math.min(this.mapWidth - 1, Math.ceil((cameraX + canvasWidth) / UNIT_TO_PIXEL));
    const startTileY = Math.max(0, Math.floor(cameraY / UNIT_TO_PIXEL));
    const endTileY = Math.min(this.mapHeight - 1, Math.ceil((cameraY + canvasHeight) / UNIT_TO_PIXEL));

    ctx.save();
    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";

    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        const index = tileY * this.mapWidth + tileX;
        if (!this.traversibilityMap[index]) {
          const worldX = tileX * UNIT_TO_PIXEL;
          const worldY = tileY * UNIT_TO_PIXEL;
          ctx.fillRect(worldX, worldY, UNIT_TO_PIXEL, UNIT_TO_PIXEL);
        }
      }
    }

    ctx.restore();
  }

  private drawCollisionRegions(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    if (this.tanks.size === 0) return;

    const collisionRegions = new Set<string>();
    
    for (const tank of this.tanks.values()) {
      const regionKey = `${tank.collisionRegionX},${tank.collisionRegionY}`;
      collisionRegions.add(regionKey);
    }

    ctx.save();
    ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
    ctx.lineWidth = 3;

    for (const regionKey of collisionRegions) {
      const [regionX, regionY] = regionKey.split(',').map(Number);
      
      const worldX = regionX * COLLISION_REGION_SIZE * UNIT_TO_PIXEL;
      const worldY = regionY * COLLISION_REGION_SIZE * UNIT_TO_PIXEL;
      const regionPixelSize = COLLISION_REGION_SIZE * UNIT_TO_PIXEL;

      const regionRight = worldX + regionPixelSize;
      const regionBottom = worldY + regionPixelSize;
      const viewRight = cameraX + canvasWidth;
      const viewBottom = cameraY + canvasHeight;

      if (worldX > viewRight || regionRight < cameraX ||
          worldY > viewBottom || regionBottom < cameraY) {
        continue;
      }

      ctx.strokeRect(worldX, worldY, regionPixelSize, regionPixelSize);
    }

    ctx.restore();
  }

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handleMapInsert) connection.db.traversibilityMap.removeOnInsert(this.handleMapInsert);
      if (this.handleMapUpdate) connection.db.traversibilityMap.removeOnUpdate(this.handleMapUpdate);
      if (this.handleTankInsert) connection.db.tank.removeOnInsert(this.handleTankInsert);
      if (this.handleTankUpdate) connection.db.tank.removeOnUpdate(this.handleTankUpdate);
      if (this.handleTankDelete) connection.db.tank.removeOnDelete(this.handleTankDelete);
    }
  }
}
