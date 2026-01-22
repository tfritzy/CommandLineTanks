export class MemoryProfiler {
  private measurements: Map<string, { totalAllocated: number; count: number }> = new Map();
  private lastLogTime: number = 0;
  private isEnabled: boolean = true;

  constructor() {
    this.lastLogTime = performance.now();
  }

  public profileMemory(name: string, fn: () => void): void {
    if (!this.isEnabled) {
      fn();
      return;
    }

    if (!(performance as any).memory) {
      fn();
      return;
    }

    const memoryBefore = (performance as any).memory.usedJSHeapSize;
    fn();
    const memoryAfter = (performance as any).memory.usedJSHeapSize;
    
    const allocated = Math.max(0, memoryAfter - memoryBefore);

    const current = this.measurements.get(name) || { totalAllocated: 0, count: 0 };
    current.totalAllocated += allocated;
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
    if (!(performance as any).memory) return;

    console.log("--- Memory Profiler Results ---");
    const sorted = Array.from(this.measurements.entries()).sort(
      (a, b) => b[1].totalAllocated - a[1].totalAllocated
    );

    let totalAllocatedPerFrame = 0;
    for (const [name, data] of sorted) {
      const avgBytes = data.totalAllocated / data.count;
      const avgKB = avgBytes / 1024;
      const totalKB = data.totalAllocated / 1024;
      console.log(`${name.padEnd(25)}: ${avgKB.toFixed(2)} KB (avg) | ${totalKB.toFixed(2)} KB (total)`);
      totalAllocatedPerFrame += avgBytes;
    }
    console.log(`Total Allocated (avg/frame): ${(totalAllocatedPerFrame / 1024).toFixed(2)} KB`);
    console.log("-------------------------------");
  }

  private reset(): void {
    this.measurements.clear();
  }
}
