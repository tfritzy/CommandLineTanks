using SpacetimeDB;
using static Types;
using System;

public static partial class PickupSpawner
{
    [Table(Scheduled = nameof(SpawnPickup))]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId) })]
    public partial struct ScheduledPickupSpawn
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        public string WorldId;
    }

    [Reducer]
    public static void SpawnPickup(ReducerContext ctx, ScheduledPickupSpawn args)
    {
        var existingPickups = ctx.Db.pickup.WorldId.Filter(args.WorldId);
        int pickupCount = 0;
        foreach (var pickup in existingPickups)
        {
            pickupCount++;
        }

        if (pickupCount >= 15)
        {
            ctx.Db.ScheduledPickupSpawn.ScheduledId.Update(args with
            {
                ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = 8_000_000 })
            });
            return;
        }

        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(args.WorldId);
        if (traversibilityMap == null) return;

        int maxAttempts = 100;
        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            if (Module.TrySpawnPickup(ctx, args.WorldId, traversibilityMap.Value))
            {
                break;
            }
        }

        ctx.Db.ScheduledPickupSpawn.ScheduledId.Update(args with
        {
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = 8_000_000 })
        });
    }

    public static float GenerateNormalDistribution(Random random)
    {
        double u1 = 1.0 - random.NextDouble();
        double u2 = 1.0 - random.NextDouble();
        return (float)(Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2));
    }
}
