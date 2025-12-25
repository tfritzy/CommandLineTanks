import { getConnection } from "../spacetimedb-connection";
import { type PickupRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import PickupType from "../../module_bindings/pickup_type_type";
import { UNIT_TO_PIXEL } from "../game";
import { pickupTextureSheet } from "../texture-sheets/PickupTextureSheet";

interface PickupData {
  id: string;
  positionX: number;
  positionY: number;
  type: Infer<typeof PickupType>;
}

export class PickupManager {
  private pickups: Map<string, PickupData> = new Map();
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToPickups();
  }

  private subscribeToPickups() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("Pickups subscription error", e))
      .subscribe([`SELECT * FROM pickup WHERE WorldId = '${this.worldId}'`]);

    connection.db.pickup.onInsert(
      (_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
        this.pickups.set(pickup.id, {
          id: pickup.id,
          positionX: pickup.positionX,
          positionY: pickup.positionY,
          type: pickup.type,
        });
      }
    );

    connection.db.pickup.onDelete(
      (_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
        this.pickups.delete(pickup.id);
      }
    );
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
        this.drawPickup(ctx, pickup);
      }
    }
  }

  private drawPickup(ctx: CanvasRenderingContext2D, pickup: PickupData) {
    const worldX = pickup.positionX * UNIT_TO_PIXEL;
    const worldY = pickup.positionY * UNIT_TO_PIXEL;
    
    switch (pickup.type.tag) {
      case "Health":
        pickupTextureSheet.draw(ctx, "health", worldX, worldY);
        break;
      case "Shield":
        pickupTextureSheet.draw(ctx, "shield", worldX, worldY);
        break;
      case "TripleShooter":
        pickupTextureSheet.draw(ctx, "triple-shooter", worldX, worldY);
        break;
      case "MissileLauncher":
        pickupTextureSheet.draw(ctx, "missile-launcher", worldX, worldY);
        break;
      case "Boomerang":
        pickupTextureSheet.draw(ctx, "boomerang", worldX, worldY);
        break;
      case "Grenade":
        pickupTextureSheet.draw(ctx, "grenade", worldX, worldY);
        break;
      case "Rocket":
        pickupTextureSheet.draw(ctx, "rocket", worldX, worldY);
        break;
      case "Moag":
        pickupTextureSheet.draw(ctx, "moag", worldX, worldY);
        break;
      case "SpiderMine":
        pickupTextureSheet.draw(ctx, "spider-mine", worldX, worldY);
        break;
      default:
        pickupTextureSheet.draw(ctx, "unknown", worldX, worldY);
        break;
    }
  }
}
