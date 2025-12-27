using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void joinWorld(ReducerContext ctx, string worldId)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var world = ctx.Db.world.Id.Find(worldId);
        if (world == null)
        {
            Log.Error($"World {worldId} not found");
            return;
        }

        Tank existingTank = ctx.Db.tank.Owner.Filter(ctx.Sender).Where(t => t.WorldId == worldId).FirstOrDefault();
        if (!string.IsNullOrEmpty(existingTank.Id))
        {
            Log.Info("Player already has tank in world");
            return;
        }

        var tankName = AllocateTankName(ctx, worldId);
        if (tankName == null)
        {
            Log.Error($"No available tank names in world {world.Value.Name}");
            return;
        }

        int alliance0Count = 0;
        int alliance1Count = 0;
        foreach (var t in ctx.Db.tank.WorldId.Filter(worldId))
        {
            if (t.Alliance == 0)
            {
                alliance0Count++;
            }
            else if (t.Alliance == 1)
            {
                alliance1Count++;
            }
        }

        int assignedAlliance = alliance0Count <= alliance1Count ? 0 : 1;

        var (spawnX, spawnY) = FindSpawnPosition(ctx, world.Value, assignedAlliance, ctx.Rng);

        var tank = BuildTank(ctx, worldId, ctx.Sender, tankName, "", assignedAlliance, spawnX, spawnY, false);
        ctx.Db.tank.Insert(tank);
        Log.Info($"Player {player.Value.Name} joined world {world.Value.Name} with tank {tank.Id} named {tankName}");
    }
}
