using SpacetimeDB;
using System;

public static partial class Module
{
    [Reducer]
    public static void overdrive(ReducerContext ctx, string worldId)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        if (tank.RemainingOverdriveCooldownMicros > 0)
        {
            return;
        }

        var updatedTank = tank with
        {
            RemainingOverdriveCooldownMicros = OVERDRIVE_COOLDOWN_MICROS,
            RemainingOverdriveDurationMicros = OVERDRIVE_DURATION_MICROS
        };
        ctx.Db.tank.Id.Update(updatedTank);

        Log.Info($"Tank {tank.Name} activated overdrive");
    }
}
