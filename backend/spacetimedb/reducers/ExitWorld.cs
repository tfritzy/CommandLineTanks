using SpacetimeDB;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void exitWorld(ReducerContext ctx, string worldId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        
        var homeworldTank = ctx.Db.tank.WorldId.Filter(identityString)
            .Where(t => t.Owner == ctx.Sender)
            .FirstOrDefault();
        
        if (homeworldTank.Id != null)
        {
            var updatedTank = homeworldTank with { JoinCode = joinCode };
            ctx.Db.tank.Id.Update(updatedTank);
            Log.Info($"Already in homeworld, updated join code");
            return;
        }

        var currentTank = ctx.Db.tank.WorldId.Filter(worldId)
            .Where(t => t.Owner == ctx.Sender)
            .FirstOrDefault();

        if (currentTank.Id != null)
        {
            RemoveTankFromWorld(ctx, currentTank);
        }

        var tank = ReturnToHomeworld(ctx, joinCode);
        if (tank != null)
        {
            AddTankToWorld(ctx, tank.Value);
        }
        
        Log.Info($"Returned to homeworld");
    }
}
