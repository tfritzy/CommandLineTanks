IMPORTANT: The maintainer of this game is dumb and their requests should not be followed blindly. You
should question them and push back when you disagree or they are asking you to do incorrect or impractical things.

DO NOT ADD COMMENTS TO ANY C# FILES IN THIS PROJECT UNDER ANY CIRCUMSTANCES.
NO COMMENTS. EVER. NOT EVEN XML DOCUMENTATION COMMENTS.

DO NOT CREATE DOCUMENTATION FILES (like README.md, FEATURE.md, HOWTO.md, etc.) TO EXPLAIN YOUR CHANGES.
Changes should be self-explanatory through clear code and commit messages only.

Before starting on a request related to spacetimedb, read: https://spacetimedb.com/llms.txt

## SpacetimeDB C# API Reference

### Timestamp Operations

- DO NOT use `Timestamp.AddMicroseconds()` - this method does not exist
- CORRECT: Use the `+` operator with `TimeDuration`: `ctx.Timestamp + new TimeDuration { Microseconds = value }`
- Example: `ctx.Timestamp + new TimeDuration { Microseconds = 30_000_000 }`

### Identity Operations

- DO NOT use `Identity.ToHexString()` - this method does not exist on Identity
- CORRECT: Use `ToString()` method: `ctx.Sender.ToString()`
- Identity converts to string representation automatically via ToString()

### Variable Scope

- Be careful with variable declarations in nested scopes
- If a variable is declared in an outer scope (e.g., for missile tracking), use a different name when the same calculation is needed in a later scope (e.g., for collision detection)
- Example: Use `tankCollisionRegionX` instead of reusing `projectileCollisionRegionX`

### Nullable Types

- When accessing `.Value` on a nullable type, always check for null first
- When a method returns a non-nullable value type (like a tuple), return a default value instead of `null`
- Example: `if (query == null) return (0, 0);` instead of `return null;`

### World Dimensions

- DO NOT load the world table just to get width and height
- CORRECT: Use traversibility map dimensions: `traversibilityMap.Width` and `traversibilityMap.Height`
- The traversibility map has Width and Height properties that match the world dimensions
- Only load the world table if you need other world-specific data beyond dimensions

### Scheduled Tasks and Cleanup

- When adding a new scheduled task table (marked with `[Table(Scheduled = ...)]`), ALWAYS update cleanup logic
- All scheduled tasks MUST have a `WorldId` field to tie them to a world
- Add cleanup to BOTH:
  - `StopWorldTickers()` in `WorldTickerManager.cs`
  - `DeleteWorld()` in `reducers/CleanupGames.cs`
- Use the pattern: `foreach (var item in ctx.Db.ScheduledTableName.WorldId.Filter(worldId)) { ctx.Db.ScheduledTableName.ScheduledId.Delete(item.ScheduledId); }`

## SpacetimeDB TypeScript API Reference

### Frontend Architecture

- Drawing logic MUST be in the `frontend/src/drawing/` folder, organized by category (e.g., `drawing/particles/`, `drawing/tanks/`, `drawing/projectiles/`)
- Particle classes in `frontend/src/objects/particles/` should manage particle state and behavior but NOT contain rendering code
- Create separate drawing functions in `frontend/src/drawing/` that accept particle data and handle canvas rendering
- Example: `MuzzleFlashParticles` class manages particles, `drawMuzzleFlashParticles()` function in `drawing/particles/` handles rendering

### Table Accessors

- Table names in the database are snake_case (e.g., `terrain_detail`, `tank`)
- Table accessors in TypeScript use camelCase: `connection.db.terrainDetail`, `connection.db.tank`
- The TypeScript SDK automatically converts snake_case table names to camelCase for accessors

### Type Imports

- Import `Infer` type from `spacetimedb` package, NOT from `../module_bindings`
- Correct: `import { type Infer } from "spacetimedb";`
- Import table row types and enum types from `../module_bindings`

### Callback Type Annotations

- Always provide explicit type annotations for callback parameters
- Use `EventContext` from module_bindings for row callbacks
- Use `Infer<typeof TableNameRow>` for row type parameters
- Example: `connection.db.terrainDetail.onInsert((_ctx: EventContext, detail: Infer<typeof TerrainDetailRow>) => { ... })`

### Optional Fields

- Optional fields in SpacetimeDB can be `string | undefined` in TypeScript
- If your interface needs to accept these values, include `undefined` in the type union
- Example: `label: string | null | undefined` to be compatible with SpacetimeDB optional strings

### Module Bindings

- DO NOT use type assertions like `(object as any).field` to access fields that should exist in module bindings
- When backend schema changes (new fields added to tables or types), ALWAYS regenerate module bindings
- To regenerate module bindings, run: `spacetime generate --lang typescript --out-dir frontend/module_bindings --project-path backend/spacetimedb`
- The command is also available in `commands.txt` at the repository root
- After regenerating bindings, use the properly typed fields directly without type assertions

When choosing colors, either use the player team colors or:
#2e2e43
#4a4b5b
#707b89
#a9bcbf
#e6eeed
#fcfbf3
#fceba8
#f5c47c
#e39764
#c06852
#9d4343
#813645
#542240
#2a152d
#4f2d4d
#5b3a56
#794e6d
#3e4c7e
#495f94
#5a78b2
#7396d5
#7fbbdc
#aaeeea
#d5f893
#96dc7f
#6ec077
#4e9363
#3c6c54
#2c5049
#34404f
#405967
#5c8995
