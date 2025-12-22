import { getConnection } from "../spacetimedb-connection";
import { type PickupRow, type EventContext } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import PickupType from "../../module_bindings/pickup_type_type";
import { UNIT_TO_PIXEL } from "../game";
import { Projectile } from "../objects/projectiles/Projectile";
import { MissileProjectile } from "../objects/projectiles/MissileProjectile";
import { RocketProjectile } from "../objects/projectiles/RocketProjectile";
import { GrenadeProjectile } from "../objects/projectiles/GrenadeProjectile";
import { MoagProjectile } from "../objects/projectiles/MoagProjectile";
import { ProjectileTextureSheet } from "./ProjectileTextureSheet";

interface PickupData {
  id: string;
  positionX: number;
  positionY: number;
  type: Infer<typeof PickupType>;
  projectile?: Projectile;
}

export class PickupManager {
  private pickups: Map<string, PickupData> = new Map();
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToPickups();
  }

  private createProjectileForPickup(type: Infer<typeof PickupType>, x: number, y: number): Projectile | undefined {
    const angle = -Math.PI / 4;
    const velocityX = Math.cos(angle);
    const velocityY = Math.sin(angle);

    switch (type.tag) {
      case "MissileLauncher":
        return new MissileProjectile(x, y, velocityX, velocityY, 0.3, 0);
      case "Rocket":
        return new RocketProjectile(x, y, velocityX, velocityY, 0.2, 0);
      case "Grenade":
        return new GrenadeProjectile(x, y, velocityX, velocityY, 0.4, 0);
      case "Moag":
        return new MoagProjectile(x, y, velocityX, velocityY, 0.8, 0);
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

    connection.db.pickup.onInsert((_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
      const projectile = this.createProjectileForPickup(pickup.type, pickup.positionX, pickup.positionY);
      
      this.pickups.set(pickup.id, {
        id: pickup.id,
        positionX: pickup.positionX,
        positionY: pickup.positionY,
        type: pickup.type,
        projectile,
      });
    });

    connection.db.pickup.onDelete((_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
      this.pickups.delete(pickup.id);
    });
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, canvasWidth: number, canvasHeight: number) {
    const startTileX = Math.floor(cameraX / UNIT_TO_PIXEL);
    const endTileX = Math.ceil((cameraX + canvasWidth) / UNIT_TO_PIXEL);
    const startTileY = Math.floor(cameraY / UNIT_TO_PIXEL);
    const endTileY = Math.ceil((cameraY + canvasHeight) / UNIT_TO_PIXEL);

    const textureSheet = ProjectileTextureSheet.getInstance();

    for (const pickup of this.pickups.values()) {
      if (pickup.positionX >= startTileX && pickup.positionX <= endTileX &&
          pickup.positionY >= startTileY && pickup.positionY <= endTileY) {
        if (pickup.projectile) {
          pickup.projectile.drawShadow(ctx, textureSheet);
        } else {
          this.drawPickupShadow(ctx, pickup);
        }
      }
    }

    for (const pickup of this.pickups.values()) {
      if (pickup.positionX >= startTileX && pickup.positionX <= endTileX &&
          pickup.positionY >= startTileY && pickup.positionY <= endTileY) {
        if (pickup.projectile) {
          pickup.projectile.drawBody(ctx, textureSheet);
        } else {
          this.drawPickup(ctx, pickup);
        }
      }
    }
  }

  private drawPickupShadow(ctx: CanvasRenderingContext2D, pickup: PickupData) {
    const worldX = pickup.positionX * UNIT_TO_PIXEL;
    const worldY = pickup.positionY * UNIT_TO_PIXEL;
    const size = UNIT_TO_PIXEL * 0.6;

    ctx.save();
    ctx.translate(worldX - 4, worldY + 4);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPickup(ctx: CanvasRenderingContext2D, pickup: PickupData) {
    const worldX = pickup.positionX * UNIT_TO_PIXEL;
    const worldY = pickup.positionY * UNIT_TO_PIXEL;
    const size = UNIT_TO_PIXEL * 0.6;

    ctx.save();
    ctx.translate(worldX, worldY);

    ctx.fillStyle = "#96dc7f";
    ctx.strokeStyle = "#6ec077";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#fcfbf3";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    const crossSize = size * 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -crossSize / 2);
    ctx.lineTo(0, crossSize / 2);
    ctx.moveTo(-crossSize / 2, 0);
    ctx.lineTo(crossSize / 2, 0);
    ctx.stroke();

    ctx.restore();
  }
}
