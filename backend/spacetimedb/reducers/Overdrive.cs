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

        if (tank.OverdriveCooldownEnd > (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch)
        {
            return;
        }

        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        ulong expirationTime = currentTime + (ulong)OVERDRIVE_DURATION_MICROS;

        var updatedTank = tank with
        {
            OverdriveCooldownEnd = currentTime + (ulong)OVERDRIVE_COOLDOWN_MICROS,
            OverdriveActiveUntil = expirationTime
        };
        ctx.Db.tank.Id.Update(updatedTank);

        Log.Info($"Tank {tank.Name} activated overdrive until {expirationTime}");
    }
}
