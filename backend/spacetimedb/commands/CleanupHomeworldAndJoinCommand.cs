using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void CleanupHomeworldAndJoinCommand(ReducerContext ctx, string worldId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        var existingTanks = ctx.Db.tank.Owner.Filter(ctx.Sender);
        bool removedHomeworldTank = false;

        foreach (var existingTank in existingTanks)
        {
            if (existingTank.WorldId == identityString)
            {
                removedHomeworldTank = true;
            }
            RemoveTankFromWorld(ctx, existingTank);
        }

        if (removedHomeworldTank && !HasAnyTanksInWorld(ctx, identityString))
        {
            StopWorldTickers(ctx, identityString);
        }

        var tank = CreateTankInWorld(ctx, worldId, ctx.Sender, joinCode);
        if (tank != null)
        {
            AddTankToWorld(ctx, tank.Value);
        }
    }
}
