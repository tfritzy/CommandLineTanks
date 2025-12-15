using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void returnHome(ReducerContext ctx)
    {
        Log.Info($"{ctx.Sender} is returning to their homeworld");

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var identityString = ctx.Sender.ToString().ToLower();
        var homeworld = ctx.Db.world.Id.Find(identityString);
        if (homeworld == null)
        {
            Log.Error($"Homeworld not found for player {player.Value.Name}");
            return;
        }

        var gameTanks = ctx.Db.tank.Owner.Filter(ctx.Sender).Where(t => t.WorldId != identityString);
        foreach (var gameTank in gameTanks)
        {
            ctx.Db.tank.Id.Delete(gameTank.Id);
            Log.Info($"Deleted game world tank {gameTank.Id} for player {player.Value.Name}");
        }

        var existingHomeworldTank = ctx.Db.tank.WorldId.Filter(identityString)
            .Where(t => t.Owner == ctx.Sender)
            .FirstOrDefault();
        
        if (existingHomeworldTank.Id != null)
        {
            Log.Info($"Player {player.Value.Name} already has a tank in homeworld");
            return;
        }

        StartWorldTickers(ctx, identityString);

        var tankName = AllocateTankName(ctx, identityString);
        if (tankName == null)
        {
            Log.Error($"No available tank names in homeworld for player {player.Value.Name}");
            return;
        }

        var tank = BuildTank(ctx, identityString, ctx.Sender, tankName, "", 0, HOMEWORLD_SIZE / 2, HOMEWORLD_SIZE / 2);
        ctx.Db.tank.Insert(tank);
        Log.Info($"Player {player.Value.Name} returned to homeworld with tank {tank.Id} named {tankName}");
    }
}
