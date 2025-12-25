using SpacetimeDB;

public static partial class Module
{
    [Table(Scheduled = nameof(CleanupSmokeCloud))]
    public partial struct ScheduledSmokeCloudCleanup
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
        [SpacetimeDB.Index.BTree]
        public string SmokeCloudId;
    }

    [Reducer]
    public static void CleanupSmokeCloud(ReducerContext ctx, ScheduledSmokeCloudCleanup args)
    {
        var cloud = ctx.Db.smoke_cloud.Id.Find(args.SmokeCloudId);
        if (cloud != null)
        {
            ctx.Db.smoke_cloud.Id.Delete(args.SmokeCloudId);
        }
    }

    public static void ScheduleSmokeCloudCleanup(ReducerContext ctx, string worldId, string smokeCloudId, ulong expirationTime)
    {
        long durationMicros = (long)(expirationTime - (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch);
        ctx.Db.ScheduledSmokeCloudCleanup.Insert(new ScheduledSmokeCloudCleanup
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = durationMicros }),
            WorldId = worldId,
            SmokeCloudId = smokeCloudId
        });
    }
}
