import { type DbConnection, type EventContext } from "../../module_bindings";
import PlayerRow from "../../module_bindings/player_table";
import { type Infer } from "spacetimedb";
import { ServerTimeSync } from "./ServerTimeSync";

interface PingMeasurement {
  sentAt: number;
  receivedAt: number;
}

export class PingTracker {
  private measurements: PingMeasurement[] = [];
  private maxMeasurements = 10;
  private pingIntervalMs = 500;
  private lastPingSentTimestamp: bigint = BigInt(0);
  private waitingForResponse: boolean = false;
  private intervalId: number | null = null;
  private connection: DbConnection | null = null;
  private currentPing: number = 0;
  private minPing: number = Infinity;
  private maxPing: number = 0;
  private started: boolean = false;

  public start(connection: DbConnection): void {
    if (this.started) {
      return;
    }
    this.started = true;
    
    this.connection = connection;
    
    this.connection.db.player.onUpdate((ctx: EventContext, _oldRow: Infer<typeof PlayerRow>, newRow: Infer<typeof PlayerRow>) => {
      if (ctx.event.tag === 'Reducer' && ctx.event.value.timestamp) {
        ServerTimeSync.getInstance().recordServerTimestamp(ctx.event.value.timestamp.microsSinceUnixEpoch);
      }
      
      if (!this.connection?.identity) return;
      if (!newRow.identity.isEqual(this.connection.identity)) return;
      if (!this.waitingForResponse) return;
      
      if (newRow.ping === this.lastPingSentTimestamp) {
        const receivedAt = performance.now();
        this.measurements.push({
          sentAt: Number(this.lastPingSentTimestamp),
          receivedAt: receivedAt,
        });

        if (this.measurements.length > this.maxMeasurements) {
          this.measurements.shift();
        }

        this.calculatePing();
        this.waitingForResponse = false;
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
    this.started = false;
    this.waitingForResponse = false;
  }

  private sendPing(): void {
    if (!this.connection) return;
    if (this.waitingForResponse) return;

    const now = performance.now();
    this.lastPingSentTimestamp = BigInt(Math.floor(now));
    this.waitingForResponse = true;
    this.connection.reducers.ping({ clientTimestamp: this.lastPingSentTimestamp });
  }

  private calculatePing(): void {
    if (this.measurements.length === 0) {
      this.currentPing = 0;
      return;
    }

    let totalRtt = 0;
    let minRtt = Infinity;
    let maxRtt = 0;
    for (const measurement of this.measurements) {
      const rtt = measurement.receivedAt - measurement.sentAt;
      totalRtt += rtt;
      if (rtt < minRtt) minRtt = rtt;
      if (rtt > maxRtt) maxRtt = rtt;
    }
    
    this.currentPing = Math.round(totalRtt / this.measurements.length);
    this.minPing = Math.round(minRtt);
    this.maxPing = Math.round(maxRtt);
  }

  public getPing(): number {
    return this.currentPing;
  }

  public getMinPing(): number {
    return this.minPing === Infinity ? 0 : this.minPing;
  }

  public getMaxPing(): number {
    return this.maxPing;
  }
}
