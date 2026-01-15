using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const int HOMEGAME_WIDTH = 30;
    private const int HOMEGAME_HEIGHT = 20;

    private static void CreateHomegame(ReducerContext ctx, string identityString)
    {
        int gameWidth = HOMEGAME_WIDTH;
        int gameHeight = HOMEGAME_HEIGHT;
        int totalTiles = gameWidth * gameHeight;

        var baseTerrain = new BaseTerrain[totalTiles];

        for (int i = 0; i < totalTiles; i++)
        {
            baseTerrain[i] = BaseTerrain.Ground;
        }

        var game = new Game
        {
            Id = identityString,
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = gameWidth,
            Height = gameHeight,
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing,
            GameType = GameType.Home
        };

        ctx.Db.game.Insert(game);
        StartHomeGameTickers(ctx, identityString);
        PickupSpawner.SpawnHomegamePickups(ctx, identityString);

        var random = new Random((int)ctx.Timestamp.MicrosecondsSinceUnixEpoch);

        for (int i = 0; i < 15; i++)
        {
            int rx = random.Next(gameWidth);
            int ry = random.Next(gameHeight);
            int rIndex = ry * gameWidth + rx;
            if (traversibilityBoolMap[rIndex] && (Math.Abs(rx - gameWidth / 2) > 3 || Math.Abs(ry - gameHeight / 2) > 3))
            {
                traversibilityBoolMap[rIndex] = false;
                projectileTraversibilityBoolMap[rIndex] = false;
                ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                    ctx: ctx,
                    gameId: identityString,
                    positionX: rx + 0.5f,
                    positionY: ry + 0.5f,
                    gridX: rx,
                    gridY: ry,
                    type: TerrainDetailType.Rock,
                    health: 100,
                    rotation: random.Next(4)
                ));
            }
        }

        for (int i = 0; i < 20; i++)
        {
            int tx = random.Next(gameWidth);
            int ty = random.Next(gameHeight);
            int tIndex = ty * gameWidth + tx;
            if (traversibilityBoolMap[tIndex] && (Math.Abs(tx - gameWidth / 2) > 3 || Math.Abs(ty - gameHeight / 2) > 3))
            {
                traversibilityBoolMap[tIndex] = false;
                projectileTraversibilityBoolMap[tIndex] = false;
                ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                    ctx: ctx,
                    gameId: identityString,
                    positionX: tx + 0.5f,
                    positionY: ty + 0.5f,
                    gridX: tx,
                    gridY: ty,
                    type: TerrainDetailType.Tree,
                    health: 100,
                    rotation: random.Next(4)
                ));
            }
        }

        ctx.Db.score.Insert(new Score
        {
            GameId = identityString,
            Kills = new int[] { 0, 0 }
        });

        InsertTraversibilityMapsForEmptyTerrain(ctx, identityString, gameWidth, gameHeight);
    }
}
