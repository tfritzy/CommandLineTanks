using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static World CreateWorld(
        ReducerContext ctx,
        string worldId,
        string worldName,
        BaseTerrain[] baseTerrain,
        (int x, int y, TerrainDetailType type, int rotation)[] terrainDetails,
        bool[] traversibilityMap)
    {
        var world = new World
        {
            Id = worldId,
            Name = worldName,
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = TerrainGenerator.GetWorldWidth(),
            Height = TerrainGenerator.GetWorldHeight(),
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing,
            GameStartedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            GameDurationMicros = GAME_DURATION_MICROS
        };

        ctx.Db.world.Insert(world);

        foreach (var detail in terrainDetails)
        {
            var terrainDetailId = GenerateId(ctx, "td");

            float posX = detail.x + 0.5f;
            float posY = detail.y + 0.5f;

            if (detail.type == TerrainDetailType.Tree)
            {
                posX += (float)(ctx.Rng.NextDouble() * 0.5 - 0.25);
                posY += (float)(ctx.Rng.NextDouble() * 0.5 - 0.25);
            }

            ctx.Db.terrain_detail.Insert(new TerrainDetail
            {
                Id = terrainDetailId,
                WorldId = worldId,
                PositionX = posX,
                PositionY = posY,
                GridX = detail.x,
                GridY = detail.y,
                Type = detail.type,
                Health = 100,
                Label = null,
                Rotation = detail.rotation
            });
        }

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

        StartWorldTickers(ctx, worldId);

        ctx.Db.ScheduledAIUpdate.Insert(new BehaviorTreeAI.ScheduledAIUpdate
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = 1_000_000 }),
            WorldId = worldId
        });

        PickupSpawner.InitializePickupSpawner(ctx, worldId, 5);

        SpiderMineUpdater.InitializeSpiderMineUpdater(ctx, worldId);

        RaycastHitCleaner.InitializeRaycastHitCleaner(ctx, worldId);

        ctx.Db.ScheduledGameEnd.Insert(new GameTimer.ScheduledGameEnd
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = GAME_DURATION_MICROS }),
            WorldId = worldId
        });

        return world;
    }
}
