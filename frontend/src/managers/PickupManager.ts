import { getConnection } from "../spacetimedb-connection";
import { type PickupRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import PickupType from "../../module_bindings/pickup_type_type";
import { UNIT_TO_PIXEL } from "../constants";
import { PickupTextureSheet } from "../texture-sheets/PickupTextureSheet";
import { drawMoagBody, drawMoagShadow } from "../drawing";

interface PickupData {
  id: string;
  positionX: number;
  positionY: number;
  type: Infer<typeof PickupType>;
}

export class PickupManager {
  private pickups: Map<string, PickupData> = new Map();
  private worldId: string;
  private pickupTextureSheet: PickupTextureSheet;
  private playerAlliance: number;
  private handlePickupInsert: ((ctx: EventContext, pickup: Infer<typeof PickupRow>) => void) | null = null;
  private handlePickupDelete: ((ctx: EventContext, pickup: Infer<typeof PickupRow>) => void) | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.playerAlliance = this.getPlayerAlliance() ?? 0;
    this.pickupTextureSheet = new PickupTextureSheet(this.playerAlliance);
    this.subscribeToPickups();
  }

  private subscribeToPickups() {
    const connection = getConnection();
    if (!connection) return;

    this.handlePickupInsert = (_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
      if (pickup.worldId !== this.worldId) return;
      this.pickups.set(pickup.id, {
        id: pickup.id,
        positionX: pickup.positionX,
        positionY: pickup.positionY,
        type: pickup.type,
      });
    };

    this.handlePickupDelete = (_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
      if (pickup.worldId !== this.worldId) return;
      this.pickups.delete(pickup.id);
    };

    connection.db.pickup.onInsert(this.handlePickupInsert);
    connection.db.pickup.onDelete(this.handlePickupDelete);

    for (const pickup of connection.db.pickup.iter()) {
      if (pickup.worldId === this.worldId) {
        this.pickups.set(pickup.id, {
          id: pickup.id,
          positionX: pickup.positionX,
          positionY: pickup.positionY,
          type: pickup.type,
        });
      }
    }
  }

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handlePickupInsert) connection.db.pickup.removeOnInsert(this.handlePickupInsert);
      if (this.handlePickupDelete) connection.db.pickup.removeOnDelete(this.handlePickupDelete);
    }
  }

  private getPlayerAlliance(): number | undefined {
    const connection = getConnection();
    if (!connection || !connection.identity) return undefined;

    for (const tank of connection.db.tank.iter()) {
      if (tank.worldId === this.worldId && tank.owner.toHexString() === connection.identity.toHexString()) {
        return tank.alliance;
      }
    }

    return undefined;
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
        this.pickupTextureSheet.draw(ctx, "health", worldX, worldY);
        break;
      case "Shield":
        this.pickupTextureSheet.draw(ctx, "shield", worldX, worldY);
        break;
      case "TripleShooter":
        this.pickupTextureSheet.draw(ctx, "triple-shooter", worldX, worldY);
        break;
      case "MissileLauncher":
        this.pickupTextureSheet.draw(ctx, "missile-launcher", worldX, worldY);
        break;
      case "Boomerang":
        this.pickupTextureSheet.draw(ctx, "boomerang", worldX, worldY);
        break;
      case "Grenade":
        this.pickupTextureSheet.draw(ctx, "grenade", worldX, worldY);
        break;
      case "Rocket":
        this.pickupTextureSheet.draw(ctx, "rocket", worldX, worldY);
        break;
      case "Moag":
        drawMoagShadow(ctx, worldX - 4, worldY + 4, 0.3);
        drawMoagBody(ctx, worldX, worldY, 0.3, this.playerAlliance);
        break;
      case "Sniper":
        this.pickupTextureSheet.draw(ctx, "sniper", worldX, worldY);
        break;
      default:
        this.pickupTextureSheet.draw(ctx, "unknown", worldX, worldY);
        break;
    }
  }
}
