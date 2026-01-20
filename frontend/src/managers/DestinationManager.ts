import { getConnection } from "../spacetimedb-connection";
import { type DestinationRow, type EventContext } from "../../module_bindings";
import DestinationType from "../../module_bindings/destination_type_type";
import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "../constants";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

interface DestinationData {
  id: string;
  targetCode: string;
  type: Infer<typeof DestinationType>;
  positionX: number;
  positionY: number;
}

export class DestinationManager {
  private destinations: Map<string, DestinationData> = new Map();
  private gameId: string;
  private subscription: TableSubscription<typeof DestinationRow> | null = null;

  constructor(gameId: string) {
    this.gameId = gameId;
    this.subscribeToDestinations();
  }

  private subscribeToDestinations() {
    const connection = getConnection();
    if (!connection) return;

    this.subscription = subscribeToTable({
      table: connection.db.destination,
      handlers: {
        onInsert: (_ctx: EventContext, destination: Infer<typeof DestinationRow>) => {
          if (destination.gameId !== this.gameId) return;
          this.destinations.set(destination.id, {
            id: destination.id,
            targetCode: destination.targetCode,
            type: destination.type,
            positionX: destination.positionX,
            positionY: destination.positionY,
          });
        },
        onDelete: (_ctx: EventContext, destination: Infer<typeof DestinationRow>) => {
          if (destination.gameId !== this.gameId) return;
          this.destinations.delete(destination.id);
        }
      }
    });
  }

  public destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.destinations.clear();
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

    for (const destination of this.destinations.values()) {
      if (
        destination.positionX >= startTileX &&
        destination.positionX <= endTileX &&
        destination.positionY >= startTileY &&
        destination.positionY <= endTileY
      ) {
        this.drawDestination(ctx, destination);
      }
    }
  }

  private drawDestination(ctx: CanvasRenderingContext2D, destination: DestinationData) {
    const gameX = destination.positionX * UNIT_TO_PIXEL;
    const gameY = destination.positionY * UNIT_TO_PIXEL;
    const isPickup = destination.type.tag === "Pickup";

    ctx.save();
    ctx.font = isPickup ? "bold 13px monospace" : "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const offsetY = isPickup ? gameY - UNIT_TO_PIXEL * 0.5 : gameY;
    
    if (isPickup) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.lineWidth = 3;
      ctx.strokeText(destination.targetCode, gameX, offsetY);
      
      ctx.fillStyle = "#fceba8";
      ctx.fillText(destination.targetCode, gameX, offsetY);
    } else {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeText(destination.targetCode, gameX, offsetY);
      
      ctx.fillStyle = "#707b89";
      ctx.fillText(destination.targetCode, gameX, offsetY);
    }
    
    ctx.restore();
  }
}
