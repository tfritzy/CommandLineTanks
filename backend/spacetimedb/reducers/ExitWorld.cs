using SpacetimeDB;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void exitWorld(ReducerContext ctx, string worldId, string joinCode)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var identityString = ctx.Sender.ToString().ToLower();
        
        var homeworldTank = ctx.Db.tank.WorldId.Filter(identityString)
            .Where(t => t.Owner == ctx.Sender)
            .FirstOrDefault();
        
        if (homeworldTank.Id != null)
        {
            var updatedTank = homeworldTank with { JoinCode = joinCode };
            ctx.Db.tank.Id.Update(updatedTank);
            Log.Info($"Player {player.Value.Name} already in homeworld, updated join code");
            return;
        }

        var currentTank = ctx.Db.tank.WorldId.Filter(worldId)
            .Where(t => t.Owner == ctx.Sender)
            .FirstOrDefault();

        if (currentTank.Id != null)
        {
            RemoveTankFromWorld(ctx, currentTank);
        }

        var tank = ReturnToHomeworld(ctx, ctx.Sender, joinCode);
        if (tank != null)
        {
            AddTankToWorld(ctx, tank.Value);
        }
        
        Log.Info($"Player {player.Value.Name} returned to homeworld");
    }
}
