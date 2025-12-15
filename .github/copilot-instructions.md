DO NOT ADD COMMENTS TO ANY C# FILES IN THIS PROJECT UNDER ANY CIRCUMSTANCES.
NO COMMENTS. EVER. NOT EVEN XML DOCUMENTATION COMMENTS.

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

## SpacetimeDB TypeScript API Reference

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
