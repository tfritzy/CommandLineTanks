using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void CleanupHomeworldAndJoinCommand(ReducerContext ctx, string worldId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        var homeworldTanks = ctx.Db.tank.WorldId.Filter(identityString).Where(t => t.Owner == ctx.Sender);
        foreach (var homeworldTank in homeworldTanks)
        {
            var fireState = ctx.Db.tank_fire_state.TankId.Find(homeworldTank.Id);
            if (fireState != null)
            {
                ctx.Db.tank_fire_state.TankId.Delete(homeworldTank.Id);
            }
            ctx.Db.tank.Id.Delete(homeworldTank.Id);
        }

        if (!HasAnyTanksInWorld(ctx, identityString))
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
