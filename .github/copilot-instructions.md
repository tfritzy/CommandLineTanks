DO NOT ADD COMMENTS TO ANY C# FILES IN THIS PROJECT UNDER ANY CIRCUMSTANCES.
NO COMMENTS. EVER. NOT EVEN XML DOCUMENTATION COMMENTS.

Before starting on a request related to spacetimedb, read: https://spacetimedb.com/llms.txt

## SpacetimeDB Multi-Column Index Usage

When using multi-column indexes like `[SpacetimeDB.Index.BTree(Columns = new[] { nameof(FieldA), nameof(FieldB) })]`:
- Chain filter methods: `ctx.Db.table.FieldA.Filter(value).FieldB.Find(value2)`
- Do NOT use LINQ `.Where()` after filtering - it runs in-memory and doesn't use the index
- The composite index generates chained accessor methods for efficient querying
