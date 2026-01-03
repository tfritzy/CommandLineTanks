import { drawMushrooms } from "../drawing/decorations/mushroom";
import { drawMushroomsTextureSheet } from "../drawing/decorations/mushroom-texture-sheet";
import { UNIT_TO_PIXEL } from "../constants";

const DEFAULT_MUSHROOM_COUNTS = [10, 50, 100, 250, 500, 1000];
const DEFAULT_ITERATIONS = 100;
const MIN_MUSHROOM_SIZE = 0.085;
const MAX_MUSHROOM_SIZE = 0.125;

interface BenchmarkResult {
  method: string;
  mushroomCount: number;
  iterations: number;
  totalTimeMs: number;
  averageTimeMs: number;
  medianTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  fps: number;
}

export class MushroomBenchmark {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1920;
    this.canvas.height = 1080;

    const ctx = this.canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Failed to get 2D context for benchmark");
    }
    this.ctx = ctx;
  }

  private generateTestMushrooms(count: number): Array<{ x: number; y: number; size: number }> {
    const mushrooms: Array<{ x: number; y: number; size: number }> = [];
    const minSize = MIN_MUSHROOM_SIZE * UNIT_TO_PIXEL;
    const maxSize = MAX_MUSHROOM_SIZE * UNIT_TO_PIXEL;

    for (let i = 0; i < count; i++) {
      const seed = i * 123.456;
      const x = (Math.abs(Math.sin(seed * 1.1)) * 1800) + 60;
      const y = (Math.abs(Math.sin(seed * 2.2)) * 1000) + 40;
      const size = minSize + (Math.abs(Math.sin(seed * 3.3)) * (maxSize - minSize));
      
      mushrooms.push({ x, y, size });
    }

    return mushrooms;
  }

  private runBenchmark(
    name: string,
    mushrooms: Array<{ x: number; y: number; size: number }>,
    drawFunction: (ctx: CanvasRenderingContext2D, mushrooms: Array<{ x: number; y: number; size: number }>) => void,
    iterations: number
  ): BenchmarkResult {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      const startTime = performance.now();
      drawFunction(this.ctx, mushrooms);
      const endTime = performance.now();
      
      times.push(endTime - startTime);
    }

    times.sort((a, b) => a - b);
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const medianTime = times[Math.floor(times.length / 2)];
    const minTime = times[0];
    const maxTime = times[times.length - 1];
    const fps = 1000 / averageTime;

    return {
      method: name,
      mushroomCount: mushrooms.length,
      iterations,
      totalTimeMs: totalTime,
      averageTimeMs: averageTime,
      medianTimeMs: medianTime,
      minTimeMs: minTime,
      maxTimeMs: maxTime,
      fps,
    };
  }

  public runComparison(mushroomCounts: number[] = DEFAULT_MUSHROOM_COUNTS, iterations: number = DEFAULT_ITERATIONS): BenchmarkResult[] {
    const results: BenchmarkResult[] = [];

    console.log("Starting mushroom drawing benchmark...");
    console.log(`Canvas size: ${this.canvas.width}x${this.canvas.height}`);
    console.log(`Iterations per test: ${iterations}`);
    console.log("---");

    for (const count of mushroomCounts) {
      console.log(`\nBenchmarking with ${count} mushrooms:`);
      
      const mushrooms = this.generateTestMushrooms(count);

      const directResult = this.runBenchmark(
        "Direct Drawing",
        mushrooms,
        drawMushrooms,
        iterations
      );
      results.push(directResult);
      console.log(`  Direct Drawing: ${directResult.averageTimeMs.toFixed(3)}ms (${directResult.fps.toFixed(1)} FPS)`);

      const textureResult = this.runBenchmark(
        "Texture Sheet",
        mushrooms,
        drawMushroomsTextureSheet,
        iterations
      );
      results.push(textureResult);
      console.log(`  Texture Sheet: ${textureResult.averageTimeMs.toFixed(3)}ms (${textureResult.fps.toFixed(1)} FPS)`);

      const speedup = directResult.averageTimeMs / textureResult.averageTimeMs;
      const percentChange = ((textureResult.averageTimeMs - directResult.averageTimeMs) / directResult.averageTimeMs * 100);
      
      if (speedup > 1) {
        console.log(`  Texture sheet is ${speedup.toFixed(2)}x faster (${Math.abs(percentChange).toFixed(1)}% faster)`);
      } else {
        console.log(`  Direct drawing is ${(1/speedup).toFixed(2)}x faster (${Math.abs(percentChange).toFixed(1)}% slower with texture sheet)`);
      }
    }

    return results;
  }

  public formatResults(results: BenchmarkResult[]): string {
    let output = "\n=== MUSHROOM DRAWING PERFORMANCE BENCHMARK RESULTS ===\n\n";
    
    const groupedResults: { [key: number]: BenchmarkResult[] } = {};
    for (const result of results) {
      if (!groupedResults[result.mushroomCount]) {
        groupedResults[result.mushroomCount] = [];
      }
      groupedResults[result.mushroomCount].push(result);
    }

    for (const count of Object.keys(groupedResults).map(Number).sort((a, b) => a - b)) {
      const group = groupedResults[count];
      output += `Mushroom Count: ${count}\n`;
      output += `${"=".repeat(50)}\n`;
      
      for (const result of group) {
        output += `\n${result.method}:\n`;
        output += `  Average: ${result.averageTimeMs.toFixed(3)}ms (${result.fps.toFixed(1)} FPS)\n`;
        output += `  Median:  ${result.medianTimeMs.toFixed(3)}ms\n`;
        output += `  Min:     ${result.minTimeMs.toFixed(3)}ms\n`;
        output += `  Max:     ${result.maxTimeMs.toFixed(3)}ms\n`;
      }

      if (group.length === 2) {
        const directResult = group.find(r => r.method === "Direct Drawing");
        const textureResult = group.find(r => r.method === "Texture Sheet");
        
        if (directResult && textureResult) {
          const speedup = directResult.averageTimeMs / textureResult.averageTimeMs;
          const percentChange = ((textureResult.averageTimeMs - directResult.averageTimeMs) / directResult.averageTimeMs * 100);
          
          output += `\nComparison:\n`;
          if (speedup > 1) {
            output += `  Texture sheet is ${speedup.toFixed(2)}x faster (${Math.abs(percentChange).toFixed(1)}% improvement)\n`;
          } else {
            output += `  Direct drawing is ${(1/speedup).toFixed(2)}x faster (${Math.abs(percentChange).toFixed(1)}% slower with texture sheet)\n`;
          }
        }
      }
      
      output += `\n`;
    }

    return output;
  }
}

export function runMushroomBenchmark() {
  const benchmark = new MushroomBenchmark();
  
  const results = benchmark.runComparison(DEFAULT_MUSHROOM_COUNTS, DEFAULT_ITERATIONS);
  
  const formattedResults = benchmark.formatResults(results);
  console.log(formattedResults);
  
  return results;
}
