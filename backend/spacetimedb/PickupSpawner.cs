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

    [Table(Scheduled = nameof(RespawnHomeworldPickup))]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId) })]
    public partial struct ScheduledHomeworldPickupRespawn
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        public string WorldId;
        public string PickupId;
        public float PositionX;
        public float PositionY;
        public TerrainDetailType Type;
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
                ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = 15_000_000 })
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
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = 15_000_000 })
        });
    }

    public static float GenerateNormalDistribution(Random random)
    {
        double u1 = 1.0 - random.NextDouble();
        double u2 = 1.0 - random.NextDouble();
        return (float)(Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2));
    }

    [Reducer]
    public static void RespawnHomeworldPickup(ReducerContext ctx, ScheduledHomeworldPickupRespawn args)
    {
        var existingPickup = ctx.Db.pickup.WorldId_PositionX_PositionY.Filter((args.WorldId, args.PositionX, args.PositionY));
        foreach (var existing in existingPickup)
        {
            Log.Info($"Pickup already exists at ({args.PositionX}, {args.PositionY}) in homeworld {args.WorldId}, skipping respawn");
            return;
        }

        ctx.Db.pickup.Insert(new Pickup
        {
            Id = args.PickupId,
            WorldId = args.WorldId,
            PositionX = args.PositionX,
            PositionY = args.PositionY,
            Type = args.Type
        });

        Log.Info($"Respawned {args.Type} at ({args.PositionX}, {args.PositionY}) in homeworld {args.WorldId}");
    }
}
