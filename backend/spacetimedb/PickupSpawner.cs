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
        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(args.WorldId);
        if (traversibilityMap == null) return;

        float centerX = traversibilityMap.Value.Width / 2.0f;
        float stdDevX = traversibilityMap.Value.Width / 6.0f;

        int maxAttempts = 100;
        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            float normalX = GenerateNormalDistribution(ctx.Rng);
            int spawnX = (int)Math.Round(centerX + normalX * stdDevX);

            int spawnY = ctx.Rng.Next(traversibilityMap.Value.Height);

            if (spawnX < 0 || spawnX >= traversibilityMap.Value.Width || spawnY < 0 || spawnY >= traversibilityMap.Value.Height)
                continue;

            int tileIndex = spawnY * traversibilityMap.Value.Width + spawnX;
            if (tileIndex >= traversibilityMap.Value.Map.Length || !traversibilityMap.Value.Map[tileIndex])
                continue;

            var existingDetail = ctx.Db.terrain_detail.WorldId_PositionX_PositionY.Filter((args.WorldId, spawnX, spawnY));
            bool tileOccupied = false;
            foreach (var detail in existingDetail)
            {
                tileOccupied = true;
                break;
            }

            if (tileOccupied)
                continue;

            TerrainDetailType pickupType = ctx.Rng.NextSingle() < 0.5f
                ? TerrainDetailType.TripleShooterPickup
                : TerrainDetailType.MissileLauncherPickup;

            var pickupId = Module.GenerateId(ctx, "pickup");
            ctx.Db.terrain_detail.Insert(new Module.TerrainDetail
            {
                Id = pickupId,
                WorldId = args.WorldId,
                PositionX = spawnX,
                PositionY = spawnY,
                Type = pickupType,
                Health = null,
                Label = null
            });

            Log.Info($"Spawned {pickupType} at ({spawnX}, {spawnY}) in world {args.WorldId}");
            break;
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
}
