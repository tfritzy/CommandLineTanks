import { getConnection } from "../spacetimedb-connection";
import { type PickupRow, type EventContext, type TankRow } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import PickupType from "../../module_bindings/pickup_type_type";
import { UNIT_TO_PIXEL } from "../constants";
import { pickupTextureSheet } from "../texture-sheets/PickupTextureSheet";
import { drawMoagBody, drawMoagShadow } from "../drawing";
import { createMultiTableSubscription, type MultiTableSubscription } from "../utils/tableSubscription";

interface PickupData {
  id: string;
  positionX: number;
  positionY: number;
  type: Infer<typeof PickupType>;
}

export class PickupManager {
  private pickups: Map<string, PickupData> = new Map();
  private worldId: string;
  private playerAlliance: number = 0;
  private subscription: MultiTableSubscription | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToTables();
  }

  private subscribeToTables() {
    const connection = getConnection();
    if (!connection) return;

    this.subscription = createMultiTableSubscription()
      .add<typeof TankRow>({
        table: connection.db.tank,
        handlers: {
          onInsert: (_ctx: EventContext, tank: Infer<typeof TankRow>) => {
            if (tank.worldId !== this.worldId) return;
            if (connection.identity && tank.owner.isEqual(connection.identity)) {
              this.playerAlliance = tank.alliance;
            }
          },
          onUpdate: (_ctx: EventContext, _oldTank: Infer<typeof TankRow>, newTank: Infer<typeof TankRow>) => {
            if (newTank.worldId !== this.worldId) return;
            if (connection.identity && newTank.owner.isEqual(connection.identity)) {
              this.playerAlliance = newTank.alliance;
            }
          }
        }
      })
      .add<typeof PickupRow>({
        table: connection.db.pickup,
        handlers: {
          onInsert: (_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
            if (pickup.worldId !== this.worldId) return;
            this.pickups.set(pickup.id, {
              id: pickup.id,
              positionX: pickup.positionX,
              positionY: pickup.positionY,
              type: pickup.type,
            });
          },
          onDelete: (_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
            if (pickup.worldId !== this.worldId) return;
            this.pickups.delete(pickup.id);
          }
        }
      });
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
    const startTileX = Math.floor(cameraX / UNIT_TO_PIXEL);
    const endTileX = Math.ceil((cameraX + canvasWidth) / UNIT_TO_PIXEL);
    const startTileY = Math.floor(cameraY / UNIT_TO_PIXEL);
    const endTileY = Math.ceil((cameraY + canvasHeight) / UNIT_TO_PIXEL);

    for (const pickup of this.pickups.values()) {
      if (
        pickup.positionX >= startTileX &&
        pickup.positionX <= endTileX &&
        pickup.positionY >= startTileY &&
        pickup.positionY <= endTileY
      ) {
        this.drawPickup(ctx, pickup, this.playerAlliance);
      }
    }
  }

  private drawPickup(ctx: CanvasRenderingContext2D, pickup: PickupData, alliance: number) {
    const worldX = pickup.positionX * UNIT_TO_PIXEL;
    const worldY = pickup.positionY * UNIT_TO_PIXEL;
    
    switch (pickup.type.tag) {
      case "Health":
        pickupTextureSheet.draw(ctx, "health", worldX, worldY, alliance);
        break;
      case "Shield":
        pickupTextureSheet.draw(ctx, "shield", worldX, worldY, alliance);
        break;
      case "TripleShooter":
        pickupTextureSheet.draw(ctx, "triple-shooter", worldX, worldY, alliance);
        break;
      case "MissileLauncher":
        pickupTextureSheet.draw(ctx, "missile-launcher", worldX, worldY, alliance);
        break;
      case "Boomerang":
        pickupTextureSheet.draw(ctx, "boomerang", worldX, worldY, alliance);
        break;
      case "Grenade":
        pickupTextureSheet.draw(ctx, "grenade", worldX, worldY, alliance);
        break;
      case "Rocket":
        pickupTextureSheet.draw(ctx, "rocket", worldX, worldY, alliance);
        break;
      case "Moag":
        drawMoagShadow(ctx, worldX - 4, worldY + 4, 0.3);
        drawMoagBody(ctx, worldX, worldY, 0.3, alliance);
        break;
      case "Sniper":
        pickupTextureSheet.draw(ctx, "sniper", worldX, worldY, alliance);
        break;
      default:
        pickupTextureSheet.draw(ctx, "unknown", worldX, worldY, alliance);
        break;
    }
  }
}
