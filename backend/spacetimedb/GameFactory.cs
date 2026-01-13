using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static Game CreateGame(
        ReducerContext ctx,
        string gameId,
        BaseTerrain[] baseTerrain,
        (int x, int y, TerrainDetailType type, int rotation)[] terrainDetails,
        byte[] traversibilityMap,
        int width,
        int height,
        GameVisibility visibility = GameVisibility.Public,
        long? gameDurationMicros = null,
        Identity? owner = null)
    {
        var duration = gameDurationMicros ?? GAME_DURATION_MICROS;
        
        var game = new Game
        {
            Id = gameId,
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = width,
            Height = height,
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing,
            IsHomeGame = false,
            GameStartedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            GameDurationMicros = duration,
            Visibility = visibility,
            MaxPlayers = 8,
            CurrentPlayerCount = 0,
            BotCount = 0,
            Owner = owner
        };

        ctx.Db.game.Insert(game);

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

            ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                ctx: ctx,
                id: terrainDetailId,
                gameId: gameId,
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
            GameId = gameId,
            Map = traversibilityMap,
            Width = width,
            Height = height
        });

        ctx.Db.score.Insert(new Score
        {
            GameId = gameId,
            Kills = new int[] { 0, 0 }
        });

        StartGameTickers(ctx, gameId);

        PickupSpawner.InitializePickupSpawner(ctx, gameId, 5);

        ctx.Db.ScheduledGameEnd.Insert(new GameTimer.ScheduledGameEnd
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = GAME_DURATION_MICROS }),
            GameId = gameId
        });

        return game;
    }
}
