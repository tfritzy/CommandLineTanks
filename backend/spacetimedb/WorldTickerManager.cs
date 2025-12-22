using SpacetimeDB;
using System.Linq;

public static partial class Module
{
    public static bool HasAnyTanksInWorld(ReducerContext ctx, string worldId)
    {
        return ctx.Db.tank.WorldId.Filter(worldId).Any();
    }

    public static void StopWorldTickers(ReducerContext ctx, string worldId)
    {
        foreach (var tankUpdater in ctx.Db.ScheduledTankUpdates.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledTankUpdates.ScheduledId.Delete(tankUpdater.ScheduledId);
        }

        foreach (var projectileUpdater in ctx.Db.ScheduledProjectileUpdates.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledProjectileUpdates.ScheduledId.Delete(projectileUpdater.ScheduledId);
        }

        Log.Info($"Stopped tickers for world {worldId}");
    }

    public static void StartWorldTickers(ReducerContext ctx, string worldId)
    {
        if (!ctx.Db.ScheduledTankUpdates.WorldId.Filter(worldId).Any())
        {
            ctx.Db.ScheduledTankUpdates.Insert(new TankUpdater.ScheduledTankUpdates
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
                WorldId = worldId,
                LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
            });
        }

        if (!ctx.Db.ScheduledProjectileUpdates.WorldId.Filter(worldId).Any())
        {
            ctx.Db.ScheduledProjectileUpdates.Insert(new ProjectileUpdater.ScheduledProjectileUpdates
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
                WorldId = worldId,
                LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
            });
        }

        Log.Info($"Started tickers for world {worldId}");
    }
}
