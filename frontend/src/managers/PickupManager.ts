import { getConnection } from "../spacetimedb-connection";
import { type PickupRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import PickupType from "../../module_bindings/pickup_type_type";
import { UNIT_TO_PIXEL } from "../game";
import { Projectile } from "../objects/projectiles/Projectile";
import { MissileProjectile } from "../objects/projectiles/MissileProjectile";
import { RocketProjectile } from "../objects/projectiles/RocketProjectile";
import { GrenadeProjectile } from "../objects/projectiles/GrenadeProjectile";
import { BoomerangProjectile } from "../objects/projectiles/BoomerangProjectile";
import { MoagProjectile } from "../objects/projectiles/MoagProjectile";
import { NormalProjectile } from "../objects/projectiles/NormalProjectile";
import { SpiderMineProjectile } from "../objects/projectiles/SpiderMineProjectile";
import { ProjectileTextureSheet } from "./ProjectileTextureSheet";
import { drawPickupShadow, drawPickupBody } from "../drawing/ui/pickups";

interface PickupData {
  id: string;
  positionX: number;
  positionY: number;
  type: Infer<typeof PickupType>;
  projectiles?: Projectile[];
}

export class PickupManager {
  private pickups: Map<string, PickupData> = new Map();
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToPickups();
  }

  private createProjectilesForPickup(
    type: Infer<typeof PickupType>,
    x: number,
    y: number
  ): Projectile[] | undefined {
    const angle = -Math.PI / 4;
    const velocityX = Math.cos(angle);
    const velocityY = Math.sin(angle);

    switch (type.tag) {
      case "TripleShooter": {
        const projectiles: Projectile[] = [];
        const arcAngle = 0.4;
        const arcRadius = 0.25;

        for (let i = 0; i < 3; i++) {
          const projectileAngle = angle + (i - 1) * arcAngle;
          const offsetX = Math.cos(angle + Math.PI / 2) * (i - 1) * arcRadius;
          const offsetY = Math.sin(angle + Math.PI / 2) * (i - 1) * arcRadius;
          const forwardOffset = i === 1 ? 0.1 : 0;
          const projX = x + offsetX + Math.cos(angle) * forwardOffset;
          const projY = y + offsetY + Math.sin(angle) * forwardOffset;
          const projVelX = Math.cos(projectileAngle);
          const projVelY = Math.sin(projectileAngle);

          projectiles.push(
            new NormalProjectile(projX, projY, projVelX, projVelY, 0.1, 0)
          );
        }
        return projectiles;
      }
      case "MissileLauncher":
        return [new MissileProjectile(x, y, velocityX, velocityY, 0.3, 0)];
      case "Rocket":
        return [new RocketProjectile(x, y, velocityX, velocityY, 0.2, 0)];
      case "Grenade":
        return [new GrenadeProjectile(x, y, velocityX, velocityY, 0.4, 0)];
      case "Boomerang":
        return [new BoomerangProjectile(x, y, velocityX, velocityY, 0.3, 0)];
      case "Moag":
        return [new MoagProjectile(x, y, velocityX, velocityY, 0.25, 0)];
      case "SpiderMine":
        return [new SpiderMineProjectile(x, y, velocityX, velocityY, 0.2, 0)];
      default:
        return undefined;
    }
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
        const projectiles = this.createProjectilesForPickup(
          pickup.type,
          pickup.positionX,
          pickup.positionY
        );

        this.pickups.set(pickup.id, {
          id: pickup.id,
          positionX: pickup.positionX,
          positionY: pickup.positionY,
          type: pickup.type,
          projectiles,
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

    const textureSheet = ProjectileTextureSheet.getInstance();

    for (const pickup of this.pickups.values()) {
      if (
        pickup.positionX >= startTileX &&
        pickup.positionX <= endTileX &&
        pickup.positionY >= startTileY &&
        pickup.positionY <= endTileY
      ) {
        if (pickup.projectiles) {
          for (const projectile of pickup.projectiles) {
            projectile.drawShadow(ctx, textureSheet);
          }
        } else {
          this.drawPickupShadow(ctx, pickup);
        }
      }
    }

    for (const pickup of this.pickups.values()) {
      if (
        pickup.positionX >= startTileX &&
        pickup.positionX <= endTileX &&
        pickup.positionY >= startTileY &&
        pickup.positionY <= endTileY
      ) {
        if (pickup.projectiles) {
          for (const projectile of pickup.projectiles) {
            projectile.drawBody(ctx, textureSheet);
          }
        } else {
          this.drawPickup(ctx, pickup);
        }
      }
    }
  }

  private drawPickupShadow(_ctx: CanvasRenderingContext2D, pickup: PickupData) {
    drawPickupShadow(_ctx, pickup.positionX, pickup.positionY);
  }

  private drawPickup(_ctx: CanvasRenderingContext2D, pickup: PickupData) {
    drawPickupBody(_ctx, pickup.positionX, pickup.positionY);
  }
}
