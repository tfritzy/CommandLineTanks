using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void findWorld(ReducerContext ctx, string joinCode)
    {
        Log.Info(ctx.Sender + " is looking for a game");

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        World? world = null;
        foreach (var w in ctx.Db.world.Iter())
        {
            world = w;
            break;
        }

        if (world == null)
        {
            Log.Error("No worlds available");
            return;
        }

        Tank existingTank = ctx.Db.tank.Owner.Filter(ctx.Sender).Where(t => t.WorldId == world?.Id).FirstOrDefault();
        if (!string.IsNullOrEmpty(existingTank.Id))
        {
            Log.Info("Player already had tank in world, so updated its join code");
            existingTank.JoinCode = joinCode;
            ctx.Db.tank.Id.Update(existingTank);
            return;
        }

        var identityString = ctx.Sender.ToString().ToLower();
        var homeworldTanks = ctx.Db.tank.WorldId.Filter(identityString).Where(t => t.Owner == ctx.Sender);
        foreach (var homeworldTank in homeworldTanks)
        {
            ctx.Db.tank.Id.Delete(homeworldTank.Id);
            Log.Info($"Deleted homeworld tank {homeworldTank.Id} for player {player.Value.Name}");
        }

        if (!HasAnyTanksInWorld(ctx, identityString))
        {
            StopWorldTickers(ctx, identityString);
        }

        var tankName = AllocateTankName(ctx, world.Value.Id);
        if (tankName == null)
        {
            Log.Error($"No available tank names in world {world.Value.Name}");
            return;
        }

        int alliance0Count = 0;
        int alliance1Count = 0;
        foreach (var t in ctx.Db.tank.WorldId.Filter(world.Value.Id))
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

        var tank = BuildTank(ctx, world.Value.Id, ctx.Sender, tankName, joinCode, assignedAlliance, spawnX, spawnY, true);
        ctx.Db.tank.Insert(tank);
        Log.Info($"Player {player.Value.Name} joined world {world.Value.Name} with tank {tank.Id} named {tankName} (joinCode: {joinCode})");
    }
}
