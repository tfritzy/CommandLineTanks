using SpacetimeDB;
using static Module;

public static partial class ProjectileTrailCleaner
{
    [Table(Scheduled = nameof(CleanProjectileTrails))]
    public partial struct ScheduledProjectileTrailCleanup
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
    }

    [Reducer]
    public static void CleanProjectileTrails(ReducerContext ctx, ScheduledProjectileTrailCleanup args)
    {
        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        ulong maxAge = 500_000;

        foreach (var trail in ctx.Db.projectile_trail.WorldId.Filter(args.WorldId))
        {
            if (currentTime - trail.SpawnedAt > maxAge)
            {
                ctx.Db.projectile_trail.Id.Delete(trail.Id);
            }
        }
    }

    public static void InitializeProjectileTrailCleaner(ReducerContext ctx, string worldId)
    {
        ctx.Db.ScheduledProjectileTrailCleanup.Insert(new ScheduledProjectileTrailCleanup
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = 100_000 }),
            WorldId = worldId
        });
    }
}
