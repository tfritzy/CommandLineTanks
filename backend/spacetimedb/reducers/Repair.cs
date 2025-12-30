using SpacetimeDB;
using System;

public static partial class Module
{
    [Reducer]
    public static void repair(ReducerContext ctx, string worldId)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        if (tank.RemainingRepairCooldownMicros > 0)
        {
            return;
        }

        if (tank.Health >= tank.MaxHealth)
        {
            return;
        }

        DeleteTankPathIfExists(ctx, tank.Id);

        var updatedTank = tank with
        {
            RemainingRepairCooldownMicros = REPAIR_COOLDOWN_MICROS,
            IsRepairing = true,
            RepairStartedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };
        ctx.Db.tank.Id.Update(updatedTank);

        Log.Info($"Tank {tank.Name} started repairing");
    }
}
