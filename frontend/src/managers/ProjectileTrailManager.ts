import { getConnection } from "../spacetimedb-connection";
import { type ProjectileTrailRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "../constants";

interface ProjectileTrailData {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  spawnedAt: bigint;
}

export class ProjectileTrailManager {
  private projectileTrails: Map<string, ProjectileTrailData> = new Map();
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToProjectileTrails();
  }

  private subscribeToProjectileTrails() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("ProjectileTrail subscription error", e))
      .subscribe([`SELECT * FROM projectile_trail WHERE WorldId = '${this.worldId}'`]);

    connection.db.projectileTrail.onInsert(
      (_ctx: EventContext, trail: Infer<typeof ProjectileTrailRow>) => {
        this.projectileTrails.set(trail.id, {
          id: trail.id,
          startX: trail.startX,
          startY: trail.startY,
          endX: trail.endX,
          endY: trail.endY,
          spawnedAt: trail.spawnedAt,
        });
      }
    );

    connection.db.projectileTrail.onDelete(
      (_ctx: EventContext, trail: Infer<typeof ProjectileTrailRow>) => {
        this.projectileTrails.delete(trail.id);
      }
    );
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    currentTime: number
  ) {
    for (const trail of this.projectileTrails.values()) {
      const age = currentTime - Number(trail.spawnedAt);
      const fadeDuration = 500000;
      
      if (age > fadeDuration) {
        continue;
      }

      const alpha = Math.max(0, 1 - age / fadeDuration);

      const startScreenX = trail.startX * UNIT_TO_PIXEL - cameraX;
      const startScreenY = trail.startY * UNIT_TO_PIXEL - cameraY;
      const endScreenX = trail.endX * UNIT_TO_PIXEL - cameraX;
      const endScreenY = trail.endY * UNIT_TO_PIXEL - cameraY;

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

  public destroy() {
  }
}
