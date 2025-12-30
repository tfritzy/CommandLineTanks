using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void CleanupHomeworldAndJoinCommand(ReducerContext ctx, string worldId, string joinCode)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found in CleanupHomeworldAndJoinCommand");
            return;
        }

        var homeworldId = player.Value.HomeworldId;
        if (homeworldId == null)
        {
            Log.Info("Player has no homeworld ID during cleanup, skipping homeworld cleanup");
        }
        else
        {
            var homeworldTanks = ctx.Db.tank.WorldId.Filter(homeworldId).Where(t => t.Owner == ctx.Sender);
            foreach (var homeworldTank in homeworldTanks)
            {
                var fireState = ctx.Db.tank_fire_state.TankId.Find(homeworldTank.Id);
                if (fireState != null)
                {
                    ctx.Db.tank_fire_state.TankId.Delete(homeworldTank.Id);
                }
                ctx.Db.tank.Id.Delete(homeworldTank.Id);
            }

            if (!HasAnyTanksInWorld(ctx, homeworldId))
            {
                StopWorldTickers(ctx, homeworldId);
            }
        }

        var tank = CreateTankInWorld(ctx, worldId, ctx.Sender, joinCode);
        if (tank != null)
        {
            AddTankToWorld(ctx, tank.Value);
        }
    }
}
