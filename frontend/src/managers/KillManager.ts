import { getConnection } from "../spacetimedb-connection";
import { type Infer } from "spacetimedb";
import KillRow from "../../module_bindings/kills_table";
import { type EventContext } from "../../module_bindings";

interface KillNotification {
  id: string;
  killeeName: string;
  timestamp: number;
  displayTime: number;
  acked: boolean;
}

export class KillManager {
  private kills: Map<string, KillNotification> = new Map();
  private worldId: string;
  private playerTankId: string | null = null;

  constructor(worldId: string) {
    this.worldId = worldId;
    this.subscribeToKills();
    this.subscribeToTanks();
  }

  private subscribeToTanks() {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to tanks: connection not available");
      return;
    }

    connection
      .subscriptionBuilder()
      .onError((e) => console.error("Tank subscription error for KillManager", e))
      .subscribe([`SELECT * FROM tank WHERE WorldId = '${this.worldId}'`]);

    connection.db.tank.onInsert((_ctx: EventContext, tank) => {
      if (tank.owner.isEqual(connection.identity)) {
        this.playerTankId = tank.id;
      }
    });

    connection.db.tank.onUpdate((_ctx: EventContext, _oldTank, newTank) => {
      if (newTank.owner.isEqual(connection.identity)) {
        this.playerTankId = newTank.id;
      }
    });
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
      if (kill.killer === this.playerTankId && !kill.acked) {
        const notification: KillNotification = {
          id: kill.id,
          killeeName: kill.killeeName,
          timestamp: Date.now(),
          displayTime: 0,
          acked: false
        };
        this.kills.set(kill.id, notification);
        this.acknowledgeKill(kill.id);
      }
    });

    connection.db.kills.onUpdate((_ctx: EventContext, _oldKill: Infer<typeof KillRow>, newKill: Infer<typeof KillRow>) => {
      const notification = this.kills.get(newKill.id);
      if (notification) {
        notification.acked = newKill.acked;
      }
    });

    connection.db.kills.onDelete((_ctx: EventContext, kill: Infer<typeof KillRow>) => {
      this.kills.delete(kill.id);
    });
  }

  private acknowledgeKill(killId: string) {
    const connection = getConnection();
    if (!connection) return;

    try {
      connection.reducers.ackKill(killId);
    } catch (e) {
      console.error("Error acknowledging kill:", e);
    }
  }

  public update(deltaTime: number) {
    for (const notification of this.kills.values()) {
      notification.displayTime += deltaTime;
      if (notification.displayTime > 3.0 && notification.acked) {
        this.kills.delete(notification.id);
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    const notifications = Array.from(this.kills.values())
      .filter(n => n.displayTime < 3.0)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (notifications.length === 0) return;

    ctx.save();

    const padding = 20;
    const notificationWidth = 300;
    const notificationHeight = 60;
    const spacing = 10;
    const x = canvasWidth / 2;
    let y = canvasHeight / 2 - 100;

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
      ? 0.8 + (0.2 * (notification.displayTime / fadeInTime))
      : 1.0;

    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(46, 46, 67, 0.95)';
    ctx.strokeStyle = '#fcfbf3';
    ctx.lineWidth = 3;
    
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(-width / 2 + radius, -height / 2);
    ctx.arcTo(width / 2, -height / 2, width / 2, height / 2, radius);
    ctx.arcTo(width / 2, height / 2, -width / 2, height / 2, radius);
    ctx.arcTo(-width / 2, height / 2, -width / 2, -height / 2, radius);
    ctx.arcTo(-width / 2, -height / 2, width / 2, -height / 2, radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 24px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = '#c06852';
    ctx.fillText('ELIMINATED', 0, -8);

    ctx.font = '600 18px Poppins, sans-serif';
    ctx.fillStyle = '#fcfbf3';
    ctx.fillText(notification.killeeName, 0, 16);

    ctx.restore();
  }
}
