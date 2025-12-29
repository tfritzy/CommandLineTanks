export class ServerTimeSync {
  private static instance: ServerTimeSync | null = null;
  private offsetSamples: number[] = [];
  private readonly MAX_SAMPLES = 50;
  private currentOffset: number = 0;

  private constructor() {}

  public static getInstance(): ServerTimeSync {
    if (!ServerTimeSync.instance) {
      ServerTimeSync.instance = new ServerTimeSync();
    }
    return ServerTimeSync.instance;
  }

  public recordServerTimestamp(serverTimestampMicros: bigint): void {
    const serverTimestampMs = Number(serverTimestampMicros / 1000n);
    const clientTimeMs = performance.now();
    
    const offset = serverTimestampMs - clientTimeMs;
    
    this.offsetSamples.push(offset);
    if (this.offsetSamples.length > this.MAX_SAMPLES) {
      this.offsetSamples.shift();
    }
    
    if (this.offsetSamples.length < 5) {
      this.currentOffset = offset;
      return;
    }

    const sorted = [...this.offsetSamples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    const threshold = 10;
    const validSamples = this.offsetSamples.filter(
      sample => Math.abs(sample - median) < threshold
    );
    
    if (validSamples.length === 0) {
      this.currentOffset = median;
      return;
    }

    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < validSamples.length; i++) {
      const age = validSamples.length - i;
      const weight = Math.pow(0.95, age);
      weightedSum += validSamples[i] * weight;
      weightSum += weight;
    }
    
    const newOffset = weightedSum / weightSum;
    this.currentOffset = this.currentOffset * 0.9 + newOffset * 0.1;
  }

  public getServerTime(): number {
    return performance.now() + this.currentOffset;
  }

  public reset(): void {
    this.offsetSamples = [];
    this.currentOffset = 0;
  }
}
