import { getConnection } from "../spacetimedb-connection";
import { SoundManager } from "./SoundManager";
import { type PickupRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import PickupType from "../../module_bindings/pickup_type_type";
import { UNIT_TO_PIXEL } from "../constants";
import { redTeamPickupTextureSheet, blueTeamPickupTextureSheet } from "../texture-sheets/PickupTextureSheet";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

interface PickupData {
  id: string;
  positionX: number;
  positionY: number;
  type: Infer<typeof PickupType>;
}

export class PickupManager {
  private pickups: Map<string, PickupData> = new Map();
  private worldId: string;
  private subscription: TableSubscription<typeof PickupRow> | null = null;
  private soundManager: SoundManager;
  private playerAlliance: number | null = null;

  constructor(worldId: string, soundManager: SoundManager) {
    this.worldId = worldId;
    this.soundManager = soundManager;
    this.subscribeToPickups();
  }

  public setPlayerAlliance(alliance: number | null) {
    this.playerAlliance = alliance;
  }

  private subscribeToPickups() {
    const connection = getConnection();
    if (!connection) return;

    this.subscription = subscribeToTable({
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

          if (pickup.type.tag === "Health") {
            this.soundManager.play("pickup-health", 0.5, pickup.positionX, pickup.positionY);
          } else if (pickup.type.tag === "Shield") {
            this.soundManager.play("pickup-shield", 0.5, pickup.positionX, pickup.positionY);
          } else {
            this.soundManager.play("pickup-weapon", 0.5, pickup.positionX, pickup.positionY);
          }
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
        this.drawPickup(ctx, pickup);
      }
    }
  }

  private drawPickup(ctx: CanvasRenderingContext2D, pickup: PickupData) {
    const worldX = pickup.positionX * UNIT_TO_PIXEL;
    const worldY = pickup.positionY * UNIT_TO_PIXEL;

    const textureSheet = this.playerAlliance === 0 ? redTeamPickupTextureSheet : blueTeamPickupTextureSheet;

    textureSheet.draw(ctx, pickup.type.tag, worldX, worldY);
  }
}
