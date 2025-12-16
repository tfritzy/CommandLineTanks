using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer(ReducerKind.Init)]
    public static void Init(ReducerContext ctx)
    {
        var worldId = GenerateId(ctx, "wld");

        var (baseTerrain, terrainDetails) = TerrainGenerator.GenerateTerrain(ctx.Rng);
        var terrainDetailArray = TerrainGenerator.ConvertToArray(
            terrainDetails,
            TerrainGenerator.GetWorldWidth(),
            TerrainGenerator.GetWorldHeight()
        );
        var traversibilityMap = TerrainGenerator.CalculateTraversibility(baseTerrain, terrainDetailArray);

        var world = new World
        {
            Id = worldId,
            Name = "Default World",
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = TerrainGenerator.GetWorldWidth(),
            Height = TerrainGenerator.GetWorldHeight(),
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing
        };

        ctx.Db.ScheduledTankUpdates.Insert(new TankUpdater.ScheduledTankUpdates
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
            WorldId = worldId,
            LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        });

        ctx.Db.ScheduledProjectileUpdates.Insert(new ProjectileUpdater.ScheduledProjectileUpdates
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
            WorldId = worldId,
            LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        });

        ctx.Db.ScheduledAIUpdate.Insert(new BehaviorTreeAI.ScheduledAIUpdate
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = 1_000_000 }),
            WorldId = worldId
        });

        ctx.Db.world.Insert(world);

        // foreach (var detail in terrainDetails)
        // {
        //     var terrainDetailId = GenerateId(ctx, "td");
        //     ctx.Db.terrain_detail.Insert(new TerrainDetail
        //     {
        //         Id = terrainDetailId,
        //         WorldId = worldId,
        //         PositionX = detail.x,
        //         PositionY = detail.y,
        //         Type = detail.type,
        //         Health = 100,
        //         Label = null
        //     });
        // }

        ctx.Db.traversibility_map.Insert(new TraversibilityMap
        {
            WorldId = worldId,
            Map = traversibilityMap,
            Width = TerrainGenerator.GetWorldWidth(),
            Height = TerrainGenerator.GetWorldHeight()
        });

        ctx.Db.score.Insert(new Score
        {
            WorldId = worldId,
            Kills = new int[] { 0, 0 }
        });

        InitializePickupSpawner(ctx, worldId, 5);

        SpawnInitialBots(ctx, worldId, world);

        Log.Info($"Initialized world {worldId}");
    }

    private static void SpawnInitialBots(ReducerContext ctx, string worldId, World world)
    {
        for (int alliance = 0; alliance < 2; alliance++)
        {
            for (int i = 0; i < 2; i++)
            {
                var tankName = AllocateTankName(ctx, worldId);
                if (tankName == null) continue;

                var (spawnX, spawnY) = FindSpawnPosition(ctx, world, alliance, ctx.Rng);
                var botTank = BuildTank(ctx, worldId, ctx.Sender, tankName, "", alliance, spawnX, spawnY, true);
                ctx.Db.tank.Insert(botTank);
            }
        }

        Log.Info($"Spawned initial bot tanks for world {worldId}");
    }
}
