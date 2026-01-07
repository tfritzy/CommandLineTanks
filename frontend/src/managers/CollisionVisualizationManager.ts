import { getConnection } from "../spacetimedb-connection";
import { type TraversibilityMapRow, type TankRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "../constants";
import { createMultiTableSubscription, type MultiTableSubscription } from "../utils/tableSubscription";

const COLLISION_REGION_SIZE = 4;

export class CollisionVisualizationManager {
  private worldId: string;
  private traversibilityMap: boolean[] = [];
  private mapWidth: number = 0;
  private mapHeight: number = 0;
  private tanks: Map<string, Infer<typeof TankRow>> = new Map();
  private subscription: MultiTableSubscription | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToTables();
  }

  private subscribeToTables() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("CollisionVisualizationManager traversibility subscription error", e))
      .subscribe([`SELECT * FROM traversibility_map WHERE WorldId = '${this.worldId}'`]);

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("CollisionVisualizationManager tank subscription error", e))
      .subscribe([`SELECT * FROM tank WHERE WorldId = '${this.worldId}'`]);

    const handleMapChange = (map: Infer<typeof TraversibilityMapRow>) => {
      if (map.worldId !== this.worldId) return;
      this.traversibilityMap = map.map;
      this.mapWidth = map.width;
      this.mapHeight = map.height;
    };

    this.subscription = createMultiTableSubscription()
      .add<typeof TraversibilityMapRow>({
        table: connection.db.traversibilityMap,
        handlers: {
          onInsert: (_ctx: EventContext, map: Infer<typeof TraversibilityMapRow>) => {
            handleMapChange(map);
          },
          onUpdate: (_ctx: EventContext, _oldMap: Infer<typeof TraversibilityMapRow>, newMap: Infer<typeof TraversibilityMapRow>) => {
            handleMapChange(newMap);
          }
        },
        loadInitialData: false
      })
      .add<typeof TankRow>({
        table: connection.db.tank,
        handlers: {
          onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.worldId !== this.worldId) return;
            this.tanks.set(tank.id, tank);
          },
          onUpdate: (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
            if (newTank.worldId !== this.worldId) return;
            this.tanks.set(newTank.id, newTank);
          },
          onDelete: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.worldId !== this.worldId) return;
            this.tanks.delete(tank.id);
          }
        }
      });

    const cachedMap = connection.db.traversibilityMap.WorldId.find(this.worldId);
    if (cachedMap) {
      handleMapChange(cachedMap);
    }
  }

  public destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
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
      const commaIndex = regionKey.indexOf(',');
      if (commaIndex === -1) continue;
      
      const regionX = parseInt(regionKey.substring(0, commaIndex));
      const regionY = parseInt(regionKey.substring(commaIndex + 1));
      
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
}
