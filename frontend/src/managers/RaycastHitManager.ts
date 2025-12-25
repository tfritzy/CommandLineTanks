import { getConnection } from "../spacetimedb-connection";
import { type RaycastHitRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "../game";

interface RaycastHitData {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  spawnedAt: bigint;
}

export class RaycastHitManager {
  private raycastHits: Map<string, RaycastHitData> = new Map();
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToRaycastHits();
  }

  private subscribeToRaycastHits() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("RaycastHit subscription error", e))
      .subscribe([`SELECT * FROM raycast_hit WHERE WorldId = '${this.worldId}'`]);

    connection.db.raycastHit.onInsert(
      (_ctx: EventContext, hit: Infer<typeof RaycastHitRow>) => {
        this.raycastHits.set(hit.id, {
          id: hit.id,
          startX: hit.startX,
          startY: hit.startY,
          endX: hit.endX,
          endY: hit.endY,
          spawnedAt: hit.spawnedAt,
        });
      }
    );

    connection.db.raycastHit.onDelete(
      (_ctx: EventContext, hit: Infer<typeof RaycastHitRow>) => {
        this.raycastHits.delete(hit.id);
      }
    );
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    currentTime: number
  ) {
    for (const hit of this.raycastHits.values()) {
      const age = currentTime - Number(hit.spawnedAt);
      const fadeDuration = 500000;
      
      if (age > fadeDuration) {
        continue;
      }

      const alpha = Math.max(0, 1 - age / fadeDuration);

      const startScreenX = hit.startX * UNIT_TO_PIXEL - cameraX;
      const startScreenY = hit.startY * UNIT_TO_PIXEL - cameraY;
      const endScreenX = hit.endX * UNIT_TO_PIXEL - cameraX;
      const endScreenY = hit.endY * UNIT_TO_PIXEL - cameraY;

      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startScreenX, startScreenY);
      ctx.lineTo(endScreenX, endScreenY);
      ctx.stroke();
      ctx.restore();
    }
  }
}
