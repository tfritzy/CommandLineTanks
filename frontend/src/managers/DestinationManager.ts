import { getConnection } from "../spacetimedb-connection";
import { type DestinationRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "../constants";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

interface DestinationData {
  id: string;
  targetCode: string;
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
    const gameY = (destination.positionY - 0.5) * UNIT_TO_PIXEL;

    ctx.save();
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.lineWidth = 3;
    ctx.strokeText(destination.targetCode, gameX, gameY);
    
    ctx.fillStyle = "#fceba8";
    ctx.fillText(destination.targetCode, gameX, gameY);
    
    ctx.restore();
  }
}
