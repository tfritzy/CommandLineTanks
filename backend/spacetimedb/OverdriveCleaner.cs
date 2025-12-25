using SpacetimeDB;

public static partial class Module
{
    [Table(Scheduled = nameof(CleanupOverdrive))]
    public partial struct ScheduledOverdriveCleanup
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
        [SpacetimeDB.Index.BTree]
        public string TankId;
    }

    [Reducer]
    public static void CleanupOverdrive(ReducerContext ctx, ScheduledOverdriveCleanup args)
    {
        var tank = ctx.Db.tank.Id.Find(args.TankId);
        if (tank != null)
        {
            var updatedTank = tank.Value with
            {
                OverdriveActiveUntil = 0
            };
            ctx.Db.tank.Id.Update(updatedTank);
        }
    }

    public static void ScheduleOverdriveCleanup(ReducerContext ctx, string worldId, string tankId, ulong expirationTime)
    {
        long durationMicros = (long)(expirationTime - (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch);
        ctx.Db.ScheduledOverdriveCleanup.Insert(new ScheduledOverdriveCleanup
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = durationMicros }),
            WorldId = worldId,
            TankId = tankId
        });
    }
}
