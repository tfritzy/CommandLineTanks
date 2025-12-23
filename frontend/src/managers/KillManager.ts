import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import KillRow from "../../module_bindings/kills_table";
import { type EventContext } from "../../module_bindings";

interface KillNotification {
  id: string;
  killeeName: string;
  timestamp: number;
  displayTime: number;
}

export class KillManager {
  private kills: Map<string, KillNotification> = new Map();
  private worldId: string;
  private deletedKills: Set<string> = new Set();

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToKills();
  }

  private subscribeToKills() {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to kills: connection not available");
      return;
    }

    connection
      .subscriptionBuilder()
      .onError((e) => console.error("Kills subscription error", e))
      .subscribe([`SELECT * FROM kills WHERE WorldId = '${this.worldId}'`]);

    connection.db.kills.onInsert((_ctx: EventContext, kill: Infer<typeof KillRow>) => {
      if (connection.identity && kill.killer.isEqual(connection.identity)) {
        const notification: KillNotification = {
          id: kill.id,
          killeeName: kill.killeeName,
          timestamp: Date.now(),
          displayTime: 0
        };
        this.kills.set(kill.id, notification);
      }
    });

    connection.db.kills.onDelete((_ctx: EventContext, kill: Infer<typeof KillRow>) => {
      this.kills.delete(kill.id);
      this.deletedKills.delete(kill.id);
    });
  }

  private deleteKill(killId: string) {
    const connection = getConnection();
    if (!connection) return;

    try {
      connection.reducers.deleteKill({ killId });
    } catch (e) {
      console.error("Error deleting kill:", e);
    }
  }

  public update(deltaTime: number) {
    for (const notification of this.kills.values()) {
      notification.displayTime += deltaTime;
      if (notification.displayTime > 3.0 && !this.deletedKills.has(notification.id)) {
        this.deletedKills.add(notification.id);
        this.deleteKill(notification.id);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, _canvasHeight: number) {
    const notifications = Array.from(this.kills.values())
      .filter(n => n.displayTime < 3.0)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (notifications.length === 0) return;

    ctx.save();

    const notificationWidth = 320;
    const notificationHeight = 40;
    const spacing = 8;
    const x = canvasWidth / 2;
    let y = 80;

    for (const notification of notifications) {
      this.drawKillNotification(ctx, notification, x, y, notificationWidth, notificationHeight);
      y += notificationHeight + spacing;
    }

    ctx.restore();
  }

  private drawKillNotification(
    ctx: CanvasRenderingContext2D,
    notification: KillNotification,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const fadeInTime = 0.3;
    const fadeOutTime = 2.5;
    
    let alpha = 1.0;
    if (notification.displayTime < fadeInTime) {
      alpha = notification.displayTime / fadeInTime;
    } else if (notification.displayTime > fadeOutTime) {
      alpha = Math.max(0, 1.0 - (notification.displayTime - fadeOutTime) / (3.0 - fadeOutTime));
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const scale = notification.displayTime < fadeInTime 
      ? 0.95 + (0.05 * (notification.displayTime / fadeInTime))
      : 1.0;

    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#2a152daa';
    
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(-width / 2 + radius, -height / 2);
    ctx.arcTo(width / 2, -height / 2, width / 2, height / 2, radius);
    ctx.arcTo(width / 2, height / 2, -width / 2, height / 2, radius);
    ctx.arcTo(-width / 2, height / 2, -width / 2, -height / 2, radius);
    ctx.arcTo(-width / 2, -height / 2, width / 2, -height / 2, radius);
    ctx.closePath();
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = '700 16px Poppins, sans-serif';
    
    const label = "ELIMINATED ";
    const name = notification.killeeName.toUpperCase();
    
    const labelWidth = ctx.measureText(label).width;
    const nameWidth = ctx.measureText(name).width;
    const totalWidth = labelWidth + nameWidth;
    
    const startX = -totalWidth / 2;
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c06852';
    ctx.fillText(label, startX, 1);
    
    ctx.fillStyle = '#fcfbf3';
    ctx.fillText(name, startX + labelWidth, 1);

    ctx.restore();
  }
}
