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

        CreateTargetingDemonstrationArea(ctx, identityString, gameWidth, gameHeight, baseTerrain);
        CreateAimingDemonstrationArea(ctx, identityString, gameWidth, gameHeight, baseTerrain);
        CreateMovementDemonstrationArea(ctx, identityString, gameWidth, gameHeight, baseTerrain);
        CreateEmptyDemonstrationArea(ctx, identityString, gameWidth, gameHeight, baseTerrain);

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

        var random = new Random((int)ctx.Timestamp.MicrosecondsSinceUnixEpoch);

        for (int i = 0; i < 15; i++)
        {
            int rx = random.Next(gameWidth);
            int ry = random.Next(gameHeight);
            int rIndex = ry * gameWidth + rx;
            if (traversibilityBoolMap[rIndex] && (Math.Abs(rx - gameWidth / 2) > 5 || Math.Abs(ry - gameHeight / 2) > 5) && !IsInsideAnyPen(rx, ry))
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
            if (traversibilityBoolMap[tIndex] && (Math.Abs(tx - gameWidth / 2) > 5 || Math.Abs(ty - gameHeight / 2) > 5) && !IsInsideAnyPen(tx, ty))
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

    private static void SpawnTurretBot(ReducerContext ctx, string gameId, int x, int y, int alliance, AiConfig? aiConfig = null)
    {
        var targetCode = AllocateTargetCode(ctx, gameId) ?? "Turret";
        var (turretBot, turretTransform) = BuildTank(
            ctx: ctx,
            id: GenerateId(ctx, "enmy"),
            gameId: gameId,
            owner: Identity.From(new byte[32]),
            name: GenerateBotName(ctx, gameId),
            targetCode: targetCode,
            joinCode: "",
            alliance: alliance,
            positionX: x + 0.5f,
            positionY: y + 0.5f,
            aiBehavior: AIBehavior.Turret,
            aiConfig: aiConfig
        );
        ctx.Db.tank.Insert(turretBot);
        ctx.Db.tank_transform.Insert(turretTransform);
    }

    private static void SpawnRandomAimBot(ReducerContext ctx, string gameId, int x, int y, int alliance, AiConfig? aiConfig = null)
    {
        var targetCode = AllocateTargetCode(ctx, gameId) ?? "AimBot";
        var (aimBot, aimTransform) = BuildTank(
            ctx: ctx,
            id: GenerateId(ctx, "enmy"),
            gameId: gameId,
            owner: Identity.From(new byte[32]),
            name: GenerateBotName(ctx, gameId),
            targetCode: targetCode,
            joinCode: "",
            alliance: alliance,
            positionX: x + 0.5f,
            positionY: y + 0.5f,
            aiBehavior: AIBehavior.RandomAim,
            aiConfig: aiConfig
        );
        ctx.Db.tank.Insert(aimBot);
        ctx.Db.tank_transform.Insert(aimTransform);
    }

    private static void SpawnTileboundBot(ReducerContext ctx, string gameId, int x, int y, int alliance, AiConfig? aiConfig = null)
    {
        var targetCode = AllocateTargetCode(ctx, gameId) ?? "TileBot";
        var (tileboundBot, tileboundTransform) = BuildTank(
            ctx: ctx,
            id: GenerateId(ctx, "enmy"),
            gameId: gameId,
            owner: Identity.From(new byte[32]),
            name: GenerateBotName(ctx, gameId),
            targetCode: targetCode,
            joinCode: "",
            alliance: alliance,
            positionX: x + 0.5f,
            positionY: y + 0.5f,
            aiBehavior: AIBehavior.Tilebound,
            aiConfig: aiConfig
        );
        ctx.Db.tank.Insert(tileboundBot);
        ctx.Db.tank_transform.Insert(tileboundTransform);
    }

    private static void CreateTargetingDemonstrationArea(ReducerContext ctx, string gameId, int gameWidth, int gameHeight, BaseTerrain[] baseTerrain)
    {
        int areaX = 20;
        int areaY = 6;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateCheckeredArea(ctx, gameId, gameWidth, gameHeight, areaX, areaY, areaWidth, areaHeight, baseTerrain);

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: areaX,
            positionY: areaY,
            gridX: areaX,
            gridY: areaY,
            type: TerrainDetailType.PenBorder
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: areaX + areaWidth / 2.0f + 0.5f,
            positionY: areaY + 0.2f,
            gridX: areaX + areaWidth / 2,
            gridY: areaY,
            type: TerrainDetailType.Label,
            health: 100,
            label: "Use [color=#fceba8]`track <code>`[/color] to lock onto an enemy, then [color=#fceba8]`fire`[/color] to shoot",
            rotation: 0
        ));

        var pen = new AiConfig
        {
            PenMinX = areaX,
            PenMaxX = areaX + areaWidth - 1,
            PenMinY = areaY,
            PenMaxY = areaY + areaHeight - 1
        };

        SpawnTurretBot(ctx, gameId, areaX + areaWidth / 2, areaY + areaHeight / 2, 0, pen);
        SpawnTileboundBot(ctx, gameId, areaX + 1, areaY + 1, 1, pen);
    }

    private static void CreateAimingDemonstrationArea(ReducerContext ctx, string gameId, int gameWidth, int gameHeight, BaseTerrain[] baseTerrain)
    {
        int areaX = 5;
        int areaY = 14;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateCheckeredArea(ctx, gameId, gameWidth, gameHeight, areaX, areaY, areaWidth, areaHeight, baseTerrain);

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: areaX,
            positionY: areaY,
            gridX: areaX,
            gridY: areaY,
            type: TerrainDetailType.PenBorder
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: areaX + areaWidth / 2.0f + 0.5f,
            positionY: areaY + 0.2f,
            gridX: areaX + areaWidth / 2,
            gridY: areaY,
            type: TerrainDetailType.Label,
            health: 100,
            label: "Use [color=#fceba8]`aim <direction>`[/color] to point your turret, then [color=#fceba8]`fire`[/color] to shoot",
            rotation: 0
        ));

        var pen = new AiConfig
        {
            PenMinX = areaX,
            PenMaxX = areaX + areaWidth - 1,
            PenMinY = areaY,
            PenMaxY = areaY + areaHeight - 1
        };

        SpawnRandomAimBot(ctx, gameId, areaX + areaWidth / 2, areaY + areaHeight / 2, 0, pen);
    }

    private static void CreateMovementDemonstrationArea(ReducerContext ctx, string gameId, int gameWidth, int gameHeight, BaseTerrain[] baseTerrain)
    {
        int areaX = 5;
        int areaY = 6;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateCheckeredArea(ctx, gameId, gameWidth, gameHeight, areaX, areaY, areaWidth, areaHeight, baseTerrain);

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: areaX,
            positionY: areaY,
            gridX: areaX,
            gridY: areaY,
            type: TerrainDetailType.PenBorder
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: areaX + areaWidth / 2.0f + 0.5f,
            positionY: areaY + 0.2f,
            gridX: areaX + areaWidth / 2,
            gridY: areaY,
            type: TerrainDetailType.Label,
            health: 100,
            label: "Use [color=#fceba8]`drive <direction> <distance>`[/color] to move your tank",
            rotation: 0
        ));

        var pen = new AiConfig
        {
            PenMinX = areaX,
            PenMaxX = areaX + areaWidth - 1,
            PenMinY = areaY,
            PenMaxY = areaY + areaHeight - 1
        };

        SpawnTileboundBot(ctx, gameId, areaX + areaWidth / 2, areaY + areaHeight / 2, 0, pen);
    }

    private static void CreateEmptyDemonstrationArea(ReducerContext ctx, string gameId, int gameWidth, int gameHeight, BaseTerrain[] baseTerrain)
    {
        int areaX = 20;
        int areaY = 14;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateCheckeredArea(ctx, gameId, gameWidth, gameHeight, areaX, areaY, areaWidth, areaHeight, baseTerrain);

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: areaX,
            positionY: areaY,
            gridX: areaX,
            gridY: areaY,
            type: TerrainDetailType.PenBorder
        ));

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            gameId: gameId,
            positionX: areaX + areaWidth / 2.0f + 0.5f,
            positionY: areaY + 0.2f,
            gridX: areaX + areaWidth / 2,
            gridY: areaY,
            type: TerrainDetailType.Label,
            health: 100,
            label: "Use shorthands, for example: [color=#fceba8]`f`[/color] for fire, [color=#fceba8]`t <code>`[/color] for track",
            rotation: 0
        ));

        var pen = new AiConfig
        {
            PenMinX = areaX,
            PenMaxX = areaX + areaWidth - 1,
            PenMinY = areaY,
            PenMaxY = areaY + areaHeight - 1
        };

        SpawnTileboundBot(ctx, gameId, areaX + 1, areaY + 1, 1, pen);
        SpawnTileboundBot(ctx, gameId, areaX + 3, areaY + 1, 1, pen);
        SpawnTileboundBot(ctx, gameId, areaX + 2, areaY + 3, 1, pen);
    }

    private static void CreateCheckeredArea(ReducerContext ctx, string gameId, int gameWidth, int gameHeight, int startX, int startY, int width, int height, BaseTerrain[] baseTerrain)
    {
        for (int y = startY; y < startY + height; y++)
        {
            for (int x = startX; x < startX + width; x++)
            {
                if (x >= 0 && x < gameWidth && y >= 0 && y < gameHeight)
                {
                    int index = y * gameWidth + x;
                    bool isBlack = (x + y) % 2 == 0;
                    baseTerrain[index] = isBlack ? BaseTerrain.BlackChecker : BaseTerrain.WhiteChecker;
                }
            }
        }
    }

    private static bool IsInsideAnyPen(int x, int y)
    {
        return x >= 4 && x <= 25 && y >= 5 && y <= 19;
    }
}
