using SpacetimeDB;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void exitWorld(ReducerContext ctx, string worldId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();

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
