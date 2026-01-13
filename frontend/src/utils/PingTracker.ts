import { type DbConnection, type EventContext } from "../../module_bindings";
import PlayerRow from "../../module_bindings/player_table";
import { type Infer } from "spacetimedb";

interface PingMeasurement {
  sentAt: number;
  receivedAt: number;
}

export class PingTracker {
  private measurements: PingMeasurement[] = [];
  private maxMeasurements = 10;
  private pingIntervalMs = 500;
  private lastPingSentAt: number = 0;
  private intervalId: number | null = null;
  private connection: DbConnection | null = null;
  private currentPing: number = 0;

  public start(connection: DbConnection): void {
    this.connection = connection;
    
    this.connection.db.player.onUpdate((_ctx: EventContext, _oldRow: Infer<typeof PlayerRow>, newRow: Infer<typeof PlayerRow>) => {
      if (!this.connection?.identity) return;
      if (!newRow.identity.isEqual(this.connection.identity)) return;
      
      const serverTimestamp = Number(newRow.ping);
      if (serverTimestamp === this.lastPingSentAt && this.lastPingSentAt > 0) {
        const receivedAt = performance.now();
        this.measurements.push({
          sentAt: this.lastPingSentAt,
          receivedAt: receivedAt,
        });

        if (this.measurements.length > this.maxMeasurements) {
          this.measurements.shift();
        }

        this.calculatePing();
      }
    });

    this.intervalId = window.setInterval(() => {
      this.sendPing();
    }, this.pingIntervalMs);
  }

  public stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private sendPing(): void {
    if (!this.connection) return;

    this.lastPingSentAt = performance.now();
    this.connection.reducers.ping({ clientTimestamp: BigInt(Math.floor(this.lastPingSentAt)) });
  }

  private calculatePing(): void {
    if (this.measurements.length === 0) {
      this.currentPing = 0;
      return;
    }

    let totalRtt = 0;
    for (const measurement of this.measurements) {
      totalRtt += measurement.receivedAt - measurement.sentAt;
    }
    
    this.currentPing = Math.round(totalRtt / this.measurements.length);
  }

  public getPing(): number {
    return this.currentPing;
  }
}
