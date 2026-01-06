export class ServerTimeSync {
  private static instance: ServerTimeSync | null = null;
  private offsetSamples: number[] = [];
  private readonly MAX_SAMPLES = 50;
  private currentOffset: number = 0;
  private sortBuffer: number[] = [];
  private validSamplesBuffer: number[] = [];

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

    this.sortBuffer.length = this.offsetSamples.length;
    for (let i = 0; i < this.offsetSamples.length; i++) {
      this.sortBuffer[i] = this.offsetSamples[i];
    }
    this.sortBuffer.sort((a, b) => a - b);
    const median = this.sortBuffer[Math.floor(this.sortBuffer.length / 2)];
    
    const threshold = 10;
    this.validSamplesBuffer.length = 0;
    for (let i = 0; i < this.offsetSamples.length; i++) {
      if (Math.abs(this.offsetSamples[i] - median) < threshold) {
        this.validSamplesBuffer.push(this.offsetSamples[i]);
      }
    }
    
    if (this.validSamplesBuffer.length === 0) {
      this.currentOffset = median;
      return;
    }

    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < this.validSamplesBuffer.length; i++) {
      const age = this.validSamplesBuffer.length - i;
      const weight = Math.pow(0.95, age);
      weightedSum += this.validSamplesBuffer[i] * weight;
      weightSum += weight;
    }
    
    const newOffset = weightedSum / weightSum;
    this.currentOffset = this.currentOffset * 0.9 + newOffset * 0.1;
  }

  public getServerTime(): number {
    return performance.now() + this.currentOffset;
  }

  public reset(): void {
    this.offsetSamples.length = 0;
    this.sortBuffer.length = 0;
    this.validSamplesBuffer.length = 0;
    this.currentOffset = 0;
  }
}
