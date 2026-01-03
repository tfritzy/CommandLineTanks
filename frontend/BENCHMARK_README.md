# Mushroom Drawing Performance Benchmark

This directory contains a benchmarking system to compare the performance of two approaches to drawing mushrooms in the game:

1. **Direct Drawing** - The current system that uses canvas arc operations to draw each mushroom's shadow and cap
2. **Texture Sheet** - A new system that pre-renders mushrooms to a texture atlas and uses `drawImage` to copy them

## Quick Start

### Method 1: Standalone HTML Page

1. Start the development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open `http://localhost:5173/benchmark.html` in your browser

3. Configure the test parameters:
   - **Mushroom Counts**: Comma-separated list of mushroom counts to test (e.g., `10, 50, 100, 250, 500, 1000`)
   - **Iterations**: Number of times to run each test for statistical accuracy (default: 100)

4. Click "Run Benchmark" to start the test

### Method 2: Browser Console

1. Start the development server and open the main game page

2. Open the browser's developer console (F12)

3. Run the benchmark:
   ```javascript
   runMushroomBenchmark()
   ```

This will run the benchmark with default parameters (10, 50, 100, 250, 500, 1000 mushrooms, 100 iterations each) and output results to the console.

## Understanding the Results

The benchmark measures:
- **Average Time**: Mean rendering time across all iterations
- **Median Time**: Middle value when times are sorted (less affected by outliers)
- **Min/Max Time**: Fastest and slowest render times
- **FPS**: Estimated frames per second based on average time
- **Speedup**: How many times faster one method is compared to the other

Example output:
```
Mushroom Count: 100
==================================================

Direct Drawing:
  Average: 0.245ms (4081.6 FPS)
  Median:  0.240ms
  Min:     0.200ms
  Max:     0.350ms

Texture Sheet:
  Average: 0.180ms (5555.6 FPS)
  Median:  0.175ms
  Min:     0.150ms
  Max:     0.250ms

Comparison:
  Texture sheet is 1.36x faster (26.5% improvement)
```

## Implementation Files

- `src/texture-sheets/MushroomTextureSheet.ts` - Pre-renders mushrooms to a texture atlas
- `src/drawing/decorations/mushroom-texture-sheet.ts` - Drawing function using the texture sheet
- `src/drawing/decorations/mushroom.ts` - Original direct drawing function
- `src/utils/MushroomBenchmark.ts` - Benchmark implementation
- `benchmark.html` - Standalone benchmark page

## Technical Details

### Direct Drawing Approach
- Uses `ctx.arc()` to draw circles for shadows and caps
- Calls `beginPath()` and `fill()` once per mushroom layer
- Simple implementation but more canvas operations

### Texture Sheet Approach
- Pre-renders 5 size variants of mushrooms to an off-screen canvas
- Uses `ctx.drawImage()` to copy pre-rendered mushrooms
- Fewer canvas operations at render time
- Small memory overhead for the texture atlas (512x512 canvas)

### Test Methodology
- Both methods draw the same set of randomly positioned mushrooms
- Canvas is cleared between iterations to simulate real rendering
- Multiple iterations are run to account for variance
- Tests use different mushroom counts to observe scaling behavior
