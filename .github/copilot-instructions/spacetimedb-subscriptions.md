# SpacetimeDB Frontend Data Access

## Important: Subscription Requirements

In SpacetimeDB, the frontend **cannot** access data from tables unless there is an active subscription to that data. When you call `connection.db.tableName.iter()` or similar methods, you are only accessing **locally cached data** that has been synchronized through subscriptions.

### How Subscriptions Work

1. **Explicit Subscriptions**: The application must explicitly subscribe to specific queries or tables
2. **Automatic Updates**: Once subscribed, SpacetimeDB automatically keeps the local cache in sync with the database
3. **No Subscription = No Data**: Attempting to iterate over a table without a subscription will return empty results, even if the server has data

### Example Issue

```typescript
// ❌ WRONG: This will NOT retrieve all tanks from the server
const allTanks = Array.from(connection.db.tank.iter());
```

This code only accesses locally cached tanks that were synchronized through existing subscriptions. It does NOT query the server for all tanks.

### Solution

Instead of trying to count entities on the frontend:
- **Store aggregate counts directly on parent entities** (e.g., `currentPlayerCount` and `botCount` on the `Game` table)
- **Update these counts in reducers** when entities are created or deleted
- **Subscribe to the parent entity** (which is typically already subscribed)

```typescript
// ✅ CORRECT: Use pre-computed counts from the Game table
// (assuming the Game table is already subscribed, which it typically is in this app)
const games = Array.from(connection.db.game.iter());
for (const game of games) {
  console.log(`Players: ${game.currentPlayerCount}, Bots: ${game.botCount}`);
}
```

**Note**: The code above works because the application has already subscribed to the Game table. The key point is to avoid subscribing to large tables (like Tank) when you only need aggregate data.

This approach:
- Avoids the need for additional subscriptions
- Reduces network traffic
- Provides instant access to counts
- Keeps the frontend data model simple and efficient
