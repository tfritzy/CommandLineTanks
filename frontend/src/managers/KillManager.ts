import { getConnection } from "../spacetimedb-connection";
import { SoundManager } from "./SoundManager";
import { type Infer } from "spacetimedb";
import KillRow from "../../module_bindings/kills_table";
import { type EventContext } from "../../module_bindings";
import { drawKillNotification } from "../drawing/ui/kill-feed";
import { subscribeToTable, type TableSubscription } from "../utils/tableSubscription";

interface KillNotification {
  id: string;
  killeeName: string;
  timestamp: number;
  displayTime: number;
}

export class KillManager {
  private kills: Map<string, KillNotification> = new Map();
  private worldId: string;
  private soundManager: SoundManager;
  private deletedKills: Set<string> = new Set();
  private sortedNotifications: KillNotification[] = [];
  private subscription: TableSubscription<typeof KillRow> | null = null;

  constructor(worldId: string, soundManager: SoundManager) {
    this.worldId = worldId;
    this.soundManager = soundManager;
    this.subscribeToKills();
  }

  private subscribeToKills() {
    const connection = getConnection();
    if (!connection) {
      console.warn("Cannot subscribe to kills: connection not available");
      return;
    }

    this.subscription = subscribeToTable({
      table: connection.db.kills,
      handlers: {
        onInsert: (_ctx: EventContext, kill: Infer<typeof KillRow>) => {
          if (kill.worldId !== this.worldId) return;
          if (connection.identity && kill.killer.isEqual(connection.identity)) {
            const notification: KillNotification = {
              id: kill.id,
              killeeName: kill.killeeName,
              timestamp: Date.now(),
              displayTime: 0
            };
            this.kills.set(kill.id, notification);
            this.soundManager.play("kill");
          }
        },
        onDelete: (_ctx: EventContext, kill: Infer<typeof KillRow>) => {
          if (kill.worldId !== this.worldId) return;
          this.kills.delete(kill.id);
          this.deletedKills.delete(kill.id);
        }
      }
    });
  }

  public destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.kills.clear();
    this.deletedKills.clear();
    this.sortedNotifications.length = 0;
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

  public draw(ctx: CanvasRenderingContext2D, canvasWidth: number) {
    let writeIndex = 0;
    for (const notification of this.kills.values()) {
      if (notification.displayTime < 3.0) {
        if (writeIndex >= this.sortedNotifications.length) {
          this.sortedNotifications.push(notification);
        } else {
          this.sortedNotifications[writeIndex] = notification;
        }
        writeIndex++;
      }
    }
    this.sortedNotifications.length = writeIndex;

    if (this.sortedNotifications.length === 0) return;

    for (let i = 1; i < this.sortedNotifications.length; i++) {
      const current = this.sortedNotifications[i];
      let j = i - 1;
      while (j >= 0 && this.sortedNotifications[j].timestamp < current.timestamp) {
        this.sortedNotifications[j + 1] = this.sortedNotifications[j];
        j--;
      }
      this.sortedNotifications[j + 1] = current;
    }

    ctx.save();

    const notificationWidth = 320;
    const notificationHeight = 40;
    const spacing = 8;
    const x = canvasWidth / 2;
    let y = 80;

    for (const notification of this.sortedNotifications) {
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
    drawKillNotification(ctx, notification.killeeName, notification.displayTime, x, y, width, height);
  }
}
