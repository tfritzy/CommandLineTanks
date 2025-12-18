import { getConnection } from "./spacetimedb-connection";
import { type PickupRow, type EventContext, TerrainDetailType } from "../module_bindings";
import { type Infer } from "spacetimedb";
import { UNIT_TO_PIXEL } from "./game";

interface PickupData {
  id: string;
  positionX: number;
  positionY: number;
  type: Infer<typeof TerrainDetailType>;
}

export class PickupManager {
  private pickups: Map<string, PickupData> = new Map();
  private worldId: string;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToPickups();
  }

  private subscribeToPickups() {
    const connection = getConnection();
    if (!connection) return;

    connection
      .subscriptionBuilder()
      .onError((e) => console.log("Pickups subscription error", e))
      .subscribe([`SELECT * FROM pickup WHERE WorldId = '${this.worldId}'`]);

    connection.db.pickup.onInsert((_ctx: EventContext, pickup: Infer<typeof PickupRow>) => {
      this.pickups.set(pickup.id, {
        id: pickup.id,
        positionX: pickup.positionX,
        positionY: pickup.positionY,
        type: pickup.type,
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
        this.drawPickup(ctx, pickup);
      }
    }
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
        ctx.fillStyle = "#ff9900";
        ctx.strokeStyle = "#cc7700";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${size * 0.6}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("3", centerX, centerY);
        break;

      case "MissileLauncherPickup":
        ctx.fillStyle = "#ff0000";
        ctx.strokeStyle = "#cc0000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${size * 0.6}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("M", centerX, centerY);
        break;

      case "BoomerangPickup":
        ctx.fillStyle = "#8b4513";
        ctx.strokeStyle = "#654321";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${size * 0.6}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("B", centerX, centerY);
        break;

      case "HealthPickup":
        ctx.fillStyle = "#00ff00";
        ctx.strokeStyle = "#00cc00";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
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
