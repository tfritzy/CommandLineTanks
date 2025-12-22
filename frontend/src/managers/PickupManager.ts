import { getConnection } from "../spacetimedb-connection";
import { type PickupRow, type EventContext, TerrainDetailType } from "../../module_bindings";
import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "../game";
import { Projectile } from "../objects/projectiles/Projectile";
import { MissileProjectile } from "../objects/projectiles/MissileProjectile";
import { RocketProjectile } from "../objects/projectiles/RocketProjectile";
import { GrenadeProjectile } from "../objects/projectiles/GrenadeProjectile";

interface PickupData {
  id: string;
  positionX: number;
  positionY: number;
  type: Infer<typeof TerrainDetailType>;
  projectile?: Projectile;
}

export class PickupManager {
  private pickups: Map<string, PickupData> = new Map();
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToPickups();
  }

  private createProjectileForPickup(type: string, x: number, y: number): Projectile | undefined {
    const angle = -Math.PI / 4;
    const velocityX = Math.cos(angle);
    const velocityY = Math.sin(angle);

    switch (type) {
      case "MissileLauncherPickup":
        return new MissileProjectile(x, y, velocityX, velocityY, 0.3, 0);
      case "RocketPickup":
        return new RocketProjectile(x, y, velocityX, velocityY, 0.2, 0);
      case "GrenadePickup":
        return new GrenadeProjectile(x, y, velocityX, velocityY, 0.4, 0);
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
      const projectile = this.createProjectileForPickup(pickup.type.tag, pickup.positionX, pickup.positionY);
      
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

    for (const pickup of this.pickups.values()) {
      if (pickup.positionX >= startTileX && pickup.positionX <= endTileX &&
          pickup.positionY >= startTileY && pickup.positionY <= endTileY) {
        if (pickup.projectile) {
          pickup.projectile.drawShadow(ctx);
        } else {
          this.drawPickupShadow(ctx, pickup);
        }
      }
    }

    for (const pickup of this.pickups.values()) {
      if (pickup.positionX >= startTileX && pickup.positionX <= endTileX &&
          pickup.positionY >= startTileY && pickup.positionY <= endTileY) {
        if (pickup.projectile) {
          pickup.projectile.drawBody(ctx);
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
    const centerX = worldX - 4;
    const centerY = worldY + 4;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPickup(ctx: CanvasRenderingContext2D, pickup: PickupData) {
    const worldX = pickup.positionX * UNIT_TO_PIXEL;
    const worldY = pickup.positionY * UNIT_TO_PIXEL;
    const size = UNIT_TO_PIXEL * 0.6;
    const centerX = worldX;
    const centerY = worldY;

    ctx.save();

    switch (pickup.type.tag) {
      case "TripleShooterPickup":
        ctx.fillStyle = "#e39764";
        ctx.strokeStyle = "#c06852";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fcfbf3";
        ctx.font = `bold ${size * 0.6}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("3", centerX, centerY);
        break;

      case "BoomerangPickup":
        ctx.fillStyle = "#c06852";
        ctx.strokeStyle = "#9d4343";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fcfbf3";
        ctx.font = `bold ${size * 0.6}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("B", centerX, centerY);
        break;

      case "MoagPickup":
        ctx.fillStyle = "#794e6d";
        ctx.strokeStyle = "#5b3a56";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fcfbf3";
        ctx.font = `bold ${size * 0.6}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("X", centerX, centerY);
        break;

      case "HealthPickup":
        ctx.fillStyle = "#96dc7f";
        ctx.strokeStyle = "#6ec077";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#fcfbf3";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        const crossSize = size * 0.4;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - crossSize / 2);
        ctx.lineTo(centerX, centerY + crossSize / 2);
        ctx.moveTo(centerX - crossSize / 2, centerY);
        ctx.lineTo(centerX + crossSize / 2, centerY);
        ctx.stroke();
        break;
    }

    ctx.restore();
  }
}
