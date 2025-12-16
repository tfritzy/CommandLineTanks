using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void spawnBot(ReducerContext ctx, string worldId, int alliance)
    {
        World? maybeWorld = ctx.Db.world.Id.Find(worldId);
        if (maybeWorld == null)
        {
            Log.Error($"World {worldId} not found");
            return;
        }
        var world = maybeWorld.Value;

        var tankName = AllocateTankName(ctx, worldId);
        if (tankName == null)
        {
            Log.Error($"No available tank names in world {world.Name}");
            return;
        }

        var (spawnX, spawnY) = FindSpawnPosition(ctx, world, alliance, ctx.Rng);

        var botTank = BuildTank(ctx, worldId, ctx.Sender, $"Bot-{tankName}", "", alliance, spawnX, spawnY, true);
        ctx.Db.tank.Insert(botTank);

        Log.Info($"Spawned bot tank {botTank.Name} in world {world.Name} at ({spawnX}, {spawnY}) with alliance {alliance}");
    }
}
