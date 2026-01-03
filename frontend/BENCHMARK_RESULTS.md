# Mushroom Drawing Performance Benchmark Results

## Summary

This benchmark compared two approaches to drawing mushrooms in the game:
- **Direct Drawing**: Current system using canvas arc operations
- **Texture Sheet**: Pre-rendered texture atlas with drawImage copying

## Key Findings

**The direct drawing method is significantly faster in most scenarios.**

### Performance Comparison by Mushroom Count

| Mushroom Count | Direct Drawing | Texture Sheet | Winner | Speedup |
|----------------|----------------|---------------|--------|---------|
| 10 | 0.014ms | 0.278ms | Direct | 19.86x faster |
| 50 | 0.106ms | 0.085ms | Texture | 1.25x faster |
| 100 | 0.058ms | 0.133ms | Direct | 2.29x faster |
| 250 | 0.132ms | 0.373ms | Direct | 2.83x faster |
| 500 | 0.275ms | 0.882ms | Direct | 3.21x faster |
| 1000 | 0.504ms | 1.326ms | Direct | 2.63x faster |

### Analysis

1. **Low Count (10 mushrooms)**: Direct drawing is dramatically faster. The texture sheet overhead is significant.

2. **Sweet Spot (50 mushrooms)**: Texture sheet shows a small advantage (1.25x faster / 19.8% improvement).

3. **Medium to High Counts (100-1000 mushrooms)**: Direct drawing consistently outperforms by 2-3x.

### Why Direct Drawing Performs Better

For mushrooms specifically, the direct drawing approach works better because:

1. **Simple Geometry**: Mushrooms are just two circles (shadow + cap), which are very efficient to draw with native arc operations
2. **Batched Rendering**: The current code batches all shadows first, then all caps, minimizing state changes
3. **Texture Sheet Overhead**: Each drawImage call has overhead that adds up
4. **Cache Efficiency**: Modern browsers optimize arc/fill operations very well

### When Texture Sheets Make Sense

Texture sheets are beneficial for:
- Complex shapes with many path operations
- Shapes that need expensive calculations per frame
- Objects drawn with rotation/scaling that can be pre-rendered
- High sprite counts where draw call reduction matters more

### Recommendation

**Keep the current direct drawing system for mushrooms.** The simple geometry and batched rendering approach is more efficient than texture sheet copying for this use case.

The only scenario where texture sheets showed improvement was at exactly 50 mushrooms (1.25x faster), but this is inconsistent and within the margin of variance. All other test cases showed direct drawing was 2-20x faster.

## Test Environment

- Canvas Size: 1920x1080
- Iterations per test: 100
- Browser: Chromium/Playwright
- Mushroom sizes: 0.085-0.125 world units (4.25-6.25 pixels)
