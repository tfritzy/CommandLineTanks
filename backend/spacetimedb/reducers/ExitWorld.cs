using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void exitWorld(ReducerContext ctx)
    {
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
            Log.Error($"Homeworld not found for identity {identityString}");
            return;
        }

        var currentTanks = ctx.Db.tank.Owner.Filter(ctx.Sender).ToList();
        
        bool alreadyInHomeworld = false;
        foreach (var currentTank in currentTanks)
        {
            if (currentTank.WorldId == identityString)
            {
                alreadyInHomeworld = true;
                break;
            }
        }

        if (alreadyInHomeworld)
        {
            Log.Info($"Player {player.Value.Name} already in homeworld");
            return;
        }

        foreach (var currentTank in currentTanks)
        {
            var fireState = ctx.Db.tank_fire_state.TankId.Find(currentTank.Id);
            if (fireState != null)
            {
                ctx.Db.tank_fire_state.TankId.Delete(currentTank.Id);
            }
            
            RemoveTankFromWorld(ctx, currentTank);

            if (!HasAnyTanksInWorld(ctx, currentTank.WorldId))
            {
                StopWorldTickers(ctx, currentTank.WorldId);
            }
        }

        var targetCode = AllocateTargetCode(ctx, identityString);
        if (targetCode == null)
        {
            Log.Error($"No available target codes in homeworld");
            return;
        }

        var newTank = BuildTank(
            ctx,
            identityString,
            ctx.Sender,
            player.Value.Name,
            targetCode,
            "",
            0,
            HOMEWORLD_WIDTH / 2 + .5f,
            HOMEWORLD_HEIGHT / 2 + .5f);
        
        AddTankToWorld(ctx, newTank);

        StartWorldTickers(ctx, identityString);

        Log.Info($"Player {player.Value.Name} returned to homeworld");
    }
}
