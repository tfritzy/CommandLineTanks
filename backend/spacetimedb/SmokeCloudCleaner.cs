using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    [Table(Scheduled = nameof(CleanupSmokeClouds))]
    public partial struct ScheduledSmokeCloudCleanup
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
    }

    [Reducer]
    public static void CleanupSmokeClouds(ReducerContext ctx, ScheduledSmokeCloudCleanup args)
    {
        List<SmokeCloud> expiredClouds = new List<SmokeCloud>();
        foreach (var cloud in ctx.Db.smoke_cloud.WorldId.Filter(args.WorldId))
        {
            var age = ctx.Timestamp.Microseconds - cloud.SpawnedAt;
            if (age >= (ulong)SMOKESCREEN_DURATION_MICROS)
            {
                expiredClouds.Add(cloud);
            }
        }

        foreach (var cloud in expiredClouds)
        {
            ctx.Db.smoke_cloud.Id.Delete(cloud.Id);
        }
    }

    public static void ScheduleSmokeCloudCleanup(ReducerContext ctx, string worldId)
    {
        var existingSchedule = ctx.Db.ScheduledSmokeCloudCleanup.WorldId.Filter(worldId).FirstOrDefault();
        if (existingSchedule.ScheduledId != 0)
        {
            return;
        }

        ctx.Db.ScheduledSmokeCloudCleanup.Insert(new ScheduledSmokeCloudCleanup
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = 1_000_000 }),
            WorldId = worldId
        });
    }
}
