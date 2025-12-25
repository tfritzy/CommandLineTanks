using SpacetimeDB;
using static Module;

public static partial class RaycastHitCleaner
{
    [Table(Scheduled = nameof(CleanRaycastHits))]
    public partial struct ScheduledRaycastHitCleanup
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
    }

    [Reducer]
    public static void CleanRaycastHits(ReducerContext ctx, ScheduledRaycastHitCleanup args)
    {
        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        ulong maxAge = 500_000;

        foreach (var hit in ctx.Db.raycast_hit.WorldId.Filter(args.WorldId))
        {
            if (currentTime - hit.SpawnedAt > maxAge)
            {
                ctx.Db.raycast_hit.Id.Delete(hit.Id);
            }
        }
    }

    public static void InitializeRaycastHitCleaner(ReducerContext ctx, string worldId)
    {
        ctx.Db.ScheduledRaycastHitCleanup.Insert(new ScheduledRaycastHitCleanup
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = 100_000 }),
            WorldId = worldId
        });
    }
}
