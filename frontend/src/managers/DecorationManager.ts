import { getConnection } from "../spacetimedb-connection";
import {
  type DecorationRow,
  type EventContext,
} from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "../constants";

export class DecorationManager {
  private worldId: string;
  private decorations: Map<string, Infer<typeof DecorationRow>> = new Map();
  private handleDecorationInsert:
    | ((ctx: EventContext, decoration: Infer<typeof DecorationRow>) => void)
    | null = null;
  private handleDecorationDelete:
    | ((ctx: EventContext, decoration: Infer<typeof DecorationRow>) => void)
    | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToDecorations();
  }

  private subscribeToDecorations() {
    const connection = getConnection();
    if (!connection) return;

    this.handleDecorationInsert = (
      _ctx: EventContext,
      decoration: Infer<typeof DecorationRow>
    ) => {
      if (decoration.worldId !== this.worldId) return;
      this.decorations.set(decoration.id, decoration);
    };

    this.handleDecorationDelete = (
      _ctx: EventContext,
      decoration: Infer<typeof DecorationRow>
    ) => {
      if (decoration.worldId !== this.worldId) return;
      this.decorations.delete(decoration.id);
    };

    connection.db.decoration.onInsert(this.handleDecorationInsert);
    connection.db.decoration.onDelete(this.handleDecorationDelete);

    for (const decoration of connection.db.decoration.iter()) {
      if (decoration.worldId === this.worldId) {
        this.decorations.set(decoration.id, decoration);
      }
    }
  }

  public destroy() {
    const connection = getConnection();
    if (connection) {
      if (this.handleDecorationInsert)
        connection.db.decoration.removeOnInsert(this.handleDecorationInsert);
      if (this.handleDecorationDelete)
        connection.db.decoration.removeOnDelete(this.handleDecorationDelete);
    }
    this.decorations.clear();
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const padding = 2;
    const startX = cameraX / UNIT_TO_PIXEL - padding;
    const endX = (cameraX + canvasWidth) / UNIT_TO_PIXEL + padding;
    const startY = cameraY / UNIT_TO_PIXEL - padding;
    const endY = (cameraY + canvasHeight) / UNIT_TO_PIXEL + padding;

    for (const decoration of this.decorations.values()) {
      const x = decoration.positionX;
      const y = decoration.positionY;

      if (x >= startX && x <= endX && y >= startY && y <= endY) {
        if (decoration.type.tag === "Mushroom") {
          const screenX = x * UNIT_TO_PIXEL;
          const screenY = y * UNIT_TO_PIXEL;
          const radius = UNIT_TO_PIXEL * 0.15;

          ctx.fillStyle = "#c06852";
          ctx.beginPath();
          ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}
