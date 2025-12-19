# Structure Foundations Feature

This document describes the implementation of destroyed house foundations on the game map.

## Changes Made

### Backend Changes

1. **Tables.cs** - Added `Rotation` field to `TerrainDetail` table
   - Type: `int`
   - Represents rotation in degrees (0, 90, 180, 270)

2. **Types.cs** - Added new terrain detail types:
   - `FoundationEdge` - Flat wall pieces of the foundation
   - `FoundationCorner` - Corner pieces of the foundation

3. **TerrainGenerator.cs** - Added structure generation:
   - `GenerateStructures()` method creates 3-6 destroyed house foundations per map
   - Structures are 4-8 tiles wide/tall
   - Each side has a 30% chance to be completely missing (destroyed)
   - Individual wall pieces have a 20% chance to have gaps/holes
   - Foundation edges use rotation to face the correct direction (0°, 90°, 180°, 270°)
   - Foundation corners are placed at the appropriate corners with correct rotation
   - Structures avoid roads, streams, fields, and other terrain features

4. **Init.cs & ReducerHelpers.cs** - Updated to include rotation when creating terrain details

### Frontend Changes

1. **TerrainDetailObject.ts** - Added rotation support:
   - Added `rotation` field to base class
   - Added `getRotation()` method

2. **TerrainDetails.ts** - Added rendering for foundation pieces:
   - `FoundationEdge` - Renders a rectangular stone wall piece with proper rotation
   - `FoundationCorner` - Renders an L-shaped corner piece with proper rotation
   - Both use tan/brown colors (#8b7355) with darker outlines (#654321)

3. **TerrainManager.ts** - Updated to handle rotation:
   - Passes rotation to terrain detail objects
   - Handles new foundation types (with type casting for compatibility before bindings regeneration)

## How to Test

1. Regenerate TypeScript bindings:
   ```bash
   spacetime generate --lang typescript --out-dir frontend/module_bindings --project-path backend/spacetimedb
   ```

2. Publish the updated module:
   ```bash
   spacetime publish --project-path backend/spacetimedb clt
   ```

3. Run the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Look for the destroyed house foundations on the map:
   - They should appear as tan/brown rectangular structures
   - Some will be complete rectangles
   - Some will have entire sides missing (destroyed sections)
   - Some will have gaps/holes in the walls
   - They should be properly spaced from other terrain features

## Design Notes

- Foundations are traversible (tanks can drive over them)
- Structures are sparse (3-6 per map) to avoid cluttering
- The "destroyed" nature is achieved by:
  - Randomly removing entire sides (30% chance per side)
  - Adding random gaps in remaining walls (20% chance per piece)
- Rotation ensures walls face the correct direction to form coherent structures
- Corners are only placed where two perpendicular walls meet
