using SpacetimeDB;
using System.Linq;

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
        var currentTanks = ctx.Db.tank.Owner.Filter(ctx.Sender).ToList();
        
        if (currentTanks.Any(tank => tank.WorldId == identityString))
        {
            Log.Info($"Player {player.Value.Name} already in homeworld");
            return;
        }

        foreach (var currentTank in currentTanks)
        {
            RemoveTankFromWorld(ctx, currentTank);
        }

        var tank = ReturnToHomeworld(ctx, ctx.Sender);
        if (tank != null)
        {
            AddTankToWorld(ctx, tank.Value);
            Log.Info($"Player {player.Value.Name} returned to homeworld");
        }
    }
}
