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
    const size = UNIT_TO_PIXEL * 0.8;
    const centerX = worldX;
    const centerY = worldY;

    ctx.save();

    switch (pickup.type.tag) {
      case "TripleShooterPickup":
        this.drawTripleShooterPickup(ctx, centerX, centerY, size);
        this.drawLabel(ctx, centerX, centerY + size * 0.8, "Triple Shooter");
        break;

      case "MissileLauncherPickup":
        this.drawMissilePickup(ctx, centerX, centerY, size);
        this.drawLabel(ctx, centerX, centerY + size * 0.8, "Missile Launcher");
        break;

      case "BoomerangPickup":
        this.drawBoomerangPickup(ctx, centerX, centerY, size);
        this.drawLabel(ctx, centerX, centerY + size * 0.8, "Boomerang");
        break;

      case "GrenadePickup":
        this.drawGrenadePickup(ctx, centerX, centerY, size);
        this.drawLabel(ctx, centerX, centerY + size * 0.8, "Grenade");
        break;

      case "RocketPickup":
        this.drawRocketPickup(ctx, centerX, centerY, size);
        this.drawLabel(ctx, centerX, centerY + size * 0.8, "Rocket Launcher");
        break;

      case "MoagPickup":
        this.drawMoagPickup(ctx, centerX, centerY, size);
        this.drawLabel(ctx, centerX, centerY + size * 0.8, "MOAG");
        break;

      case "HealthPickup":
        this.drawHealthPickup(ctx, centerX, centerY, size);
        this.drawLabel(ctx, centerX, centerY + size * 0.8, "Health");
        break;
    }

    ctx.restore();
  }

  private drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const metrics = ctx.measureText(text);
    const padding = 4;
    ctx.fillRect(
      x - metrics.width / 2 - padding,
      y - padding,
      metrics.width + padding * 2,
      16 + padding * 2
    );
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  private drawTripleShooterPickup(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
    const bulletSize = size * 0.25;
    const spacing = size * 0.35;
    
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = "#ff9900";
      ctx.strokeStyle = "#cc7700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX + i * spacing, centerY, bulletSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawMissilePickup(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-Math.PI / 4);
    
    const length = size * 0.6;
    const width = size * 0.25;
    
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(-length * 0.3, -width / 2);
    ctx.lineTo(-length, -width / 3);
    ctx.lineTo(-length, width / 3);
    ctx.lineTo(-length * 0.3, width / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.moveTo(-length * 0.3, -width / 2);
    ctx.lineTo(-length, -width / 1.5);
    ctx.lineTo(-length, -width / 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-length * 0.3, width / 2);
    ctx.lineTo(-length, width / 1.5);
    ctx.lineTo(-length, width / 3);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  private drawBoomerangPickup(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
    ctx.save();
    ctx.translate(centerX, centerY);
    
    const length = size * 0.5;
    const width = size * 0.15;
    
    ctx.fillStyle = '#8b4513';
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.5, -length * 0.3, length, -length * 0.2);
    ctx.lineTo(length * 0.9, -length * 0.2 + width);
    ctx.quadraticCurveTo(length * 0.4, -length * 0.25, 0, width);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.3, length * 0.5, length * 0.2, length);
    ctx.lineTo(length * 0.2 + width, length * 0.9);
    ctx.quadraticCurveTo(length * 0.25, length * 0.4, width, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }

  private drawGrenadePickup(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
    const radius = size * 0.3;
    
    ctx.fillStyle = '#2a5a2a';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#1a3a1a';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const pinHeight = radius * 1.2;
    ctx.fillStyle = '#888888';
    ctx.fillRect(centerX - radius * 0.15, centerY - radius - pinHeight, radius * 0.3, pinHeight);
    
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(centerX, centerY - radius - pinHeight, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawRocketPickup(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-Math.PI / 4);
    
    const length = size * 0.7;
    const width = size * 0.2;
    
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(-length * 0.2, -width / 2);
    ctx.lineTo(-length * 0.8, -width / 2);
    ctx.lineTo(-length, -width / 3);
    ctx.lineTo(-length, width / 3);
    ctx.lineTo(-length * 0.8, width / 2);
    ctx.lineTo(-length * 0.2, width / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#222222';
    ctx.fillRect(length * 0.3, -width * 0.3, length * 0.3, width * 0.6);
    
    ctx.restore();
  }

  private drawMoagPickup(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
    const radius = size * 0.3;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
    gradient.addColorStop(0, '#ff00ff');
    gradient.addColorStop(0.5, '#9400d3');
    gradient.addColorStop(1, '#4b0082');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle) * radius * 0.3;
      const y1 = centerY + Math.sin(angle) * radius * 0.3;
      const x2 = centerX + Math.cos(angle) * radius * 0.8;
      const y2 = centerY + Math.sin(angle) * radius * 0.8;
      
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  private drawHealthPickup(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
    const radius = size * 0.3;
    
    ctx.fillStyle = "#00ff00";
    ctx.strokeStyle = "#00cc00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const crossSize = radius * 0.8;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - crossSize / 2);
    ctx.lineTo(centerX, centerY + crossSize / 2);
    ctx.moveTo(centerX - crossSize / 2, centerY);
    ctx.lineTo(centerX + crossSize / 2, centerY);
    ctx.stroke();
  }
}
