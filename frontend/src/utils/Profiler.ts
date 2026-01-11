export class Profiler {
  private measurements: Map<string, { total: number; count: number }> = new Map();
  private lastLogTime: number = 0;
  private isEnabled: boolean = true;

  constructor() {
    this.lastLogTime = performance.now();
  }

  public profile(name: string, fn: () => void): void {
    if (!this.isEnabled) {
      fn();
      return;
    }

    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;

    const current = this.measurements.get(name) || { total: 0, count: 0 };
    current.total += duration;
    current.count++;
    this.measurements.set(name, current);
  }

  public update(): void {
    const now = performance.now();
    if (now - this.lastLogTime >= 1000) {
      this.logResults();
      this.reset();
      this.lastLogTime = now;
    }
  }

  private logResults(): void {
    if (this.measurements.size === 0) return;

    console.log("--- Profiler Results (ms) ---");
    const sorted = Array.from(this.measurements.entries()).sort(
      (a, b) => b[1].total - a[1].total
    );

    let totalFrameTime = 0;
    for (const [name, data] of sorted) {
      const avg = data.total / data.count;
      console.log(`${name.padEnd(25)}: ${avg.toFixed(4)} (avg) | ${data.total.toFixed(2)} (total)`);
      totalFrameTime += avg;
    }
    console.log(`Total Draw Loop (avg): ${totalFrameTime.toFixed(4)}ms`);
    console.log("----------------------------");
  }

  private reset(): void {
    this.measurements.clear();
  }
}
