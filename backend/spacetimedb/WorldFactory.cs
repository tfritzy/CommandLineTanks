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
        bool[] traversibilityMap,
        int width,
        int height,
        WorldVisibility visibility = WorldVisibility.Public,
        string passcode = "",
        long? gameDurationMicros = null)
    {
        var hasPasscode = !string.IsNullOrEmpty(passcode);
        var duration = gameDurationMicros ?? GAME_DURATION_MICROS;
        
        var world = new World
        {
            Id = worldId,
            Name = worldName,
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = width,
            Height = height,
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing,
            IsHomeWorld = false,
            GameStartedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            GameDurationMicros = duration,
            Visibility = visibility,
            HasPasscode = hasPasscode,
            MaxPlayers = 8,
            CurrentPlayerCount = 0,
            BotCount = 0
        };

        ctx.Db.world.Insert(world);

        if (hasPasscode)
        {
            ctx.Db.world_passcode.Insert(new WorldPasscode
            {
                WorldId = worldId,
                Passcode = passcode
            });
        }

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

            ctx.Db.terrain_detail.Insert(BuildTerrainDetail(
                ctx: ctx,
                id: terrainDetailId,
                worldId: worldId,
                positionX: posX,
                positionY: posY,
                gridX: detail.x,
                gridY: detail.y,
                type: detail.type,
                health: 100,
                label: null,
                rotation: detail.rotation
            ));
        }

        ctx.Db.traversibility_map.Insert(new TraversibilityMap
        {
            WorldId = worldId,
            Map = traversibilityMap,
            Width = width,
            Height = height
        });

        ctx.Db.score.Insert(new Score
        {
            WorldId = worldId,
            Kills = new int[] { 0, 0 }
        });

        StartWorldTickers(ctx, worldId);

        PickupSpawner.InitializePickupSpawner(ctx, worldId, 5);

        ctx.Db.ScheduledGameEnd.Insert(new GameTimer.ScheduledGameEnd
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = GAME_DURATION_MICROS }),
            WorldId = worldId
        });

        return world;
    }
}
