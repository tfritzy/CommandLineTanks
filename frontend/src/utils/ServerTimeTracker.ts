import { type DbConnection } from "../../module_bindings";

interface LatencyMeasurement {
  serverTimeMicros: bigint;
  clientTimeMs: number;
}

export class ServerTimeTracker {
  private measurements: LatencyMeasurement[] = [];
  private maxMeasurements = 10;
  private serverTimeOffsetMs: number = 0;
  private currentLatency: number = 0;
  private minLatency: number = Infinity;
  private maxLatency: number = 0;
  private started: boolean = false;

  public start(connection: DbConnection): void {
    if (this.started) {
      return;
    }
    this.started = true;

    connection.reducers.onUpdateTanks((ctx) => {
      this.recordMeasurement(ctx.event.timestamp.microsSinceUnixEpoch);
    });

    connection.reducers.onJoinGame((ctx) => {
      this.recordMeasurement(ctx.event.timestamp.microsSinceUnixEpoch);
    });

    connection.reducers.onCreateGame((ctx) => {
      this.recordMeasurement(ctx.event.timestamp.microsSinceUnixEpoch);
    });
  }

  public stop(): void {
    this.started = false;
    this.measurements.length = 0;
  }

  private recordMeasurement(serverTimeMicros: bigint): void {
    const clientTimeMs = performance.now() + performance.timeOrigin;

    this.measurements.push({
      serverTimeMicros,
      clientTimeMs,
    });

    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    this.calculateOffset();
  }

  private calculateOffset(): void {
    if (this.measurements.length === 0) {
      return;
    }

    let totalOffset = 0;
    let minLat = Infinity;
    let maxLat = 0;

    for (const measurement of this.measurements) {
      const serverTimeMs = Number(measurement.serverTimeMicros) / 1000;
      const latency = measurement.clientTimeMs - serverTimeMs;
      totalOffset += latency;
      if (latency < minLat) minLat = latency;
      if (latency > maxLat) maxLat = latency;
    }

    this.serverTimeOffsetMs = totalOffset / this.measurements.length;
    this.currentLatency = Math.round(this.serverTimeOffsetMs);
    this.minLatency = Math.round(minLat);
    this.maxLatency = Math.round(maxLat);
  }

  public getServerTime(): number {
    const clientTimeMs = performance.now() + performance.timeOrigin;
    return clientTimeMs - this.serverTimeOffsetMs;
  }

  public getLatency(): number {
    return this.currentLatency;
  }

  public getMinLatency(): number {
    return this.minLatency === Infinity ? 0 : this.minLatency;
  }

  public getMaxLatency(): number {
    return this.maxLatency;
  }
}
