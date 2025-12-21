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

    [Table(Name = "collected_homeworld_pickup", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId) })]
    public partial struct CollectedHomeworldPickup
    {
        [PrimaryKey]
        public string Id;
        public string WorldId;
        public float PositionX;
        public float PositionY;
        public TerrainDetailType Type;
        public ulong CollectedAt;
    }

    [Table(Scheduled = nameof(RespawnHomeworldPickups))]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId) })]
    public partial struct ScheduledHomeworldPickupRespawn
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
    public static void RespawnHomeworldPickups(ReducerContext ctx, ScheduledHomeworldPickupRespawn args)
    {
        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        ulong respawnDelay = 15_000_000;

        var collectedPickups = ctx.Db.CollectedHomeworldPickup.WorldId.Filter(args.WorldId);
        foreach (var collected in collectedPickups)
        {
            if (currentTime >= collected.CollectedAt + respawnDelay)
            {
                var existingPickup = ctx.Db.pickup.WorldId_PositionX_PositionY.Filter((collected.WorldId, collected.PositionX, collected.PositionY));
                bool exists = false;
                foreach (var existing in existingPickup)
                {
                    exists = true;
                    break;
                }

                if (!exists)
                {
                    var pickupId = Module.GenerateId(ctx, "pickup");
                    ctx.Db.pickup.Insert(new Pickup
                    {
                        Id = pickupId,
                        WorldId = collected.WorldId,
                        PositionX = collected.PositionX,
                        PositionY = collected.PositionY,
                        Type = collected.Type
                    });

                    Log.Info($"Respawned {collected.Type} at ({collected.PositionX}, {collected.PositionY}) in homeworld {collected.WorldId}");
                }

                ctx.Db.CollectedHomeworldPickup.Id.Delete(collected.Id);
            }
        }
    }
}
