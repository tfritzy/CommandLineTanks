using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const int HOMEWORLD_WIDTH = 30;
    private const int HOMEWORLD_HEIGHT = 20;

    private static void CreateHomeworld(ReducerContext ctx, string identityString)
    {
        int worldWidth = HOMEWORLD_WIDTH;
        int worldHeight = HOMEWORLD_HEIGHT;
        int totalTiles = worldWidth * worldHeight;

        var baseTerrain = new BaseTerrain[totalTiles];
        var traversibilityMap = new bool[totalTiles];

        for (int i = 0; i < totalTiles; i++)
        {
            baseTerrain[i] = BaseTerrain.Ground;
            traversibilityMap[i] = true;
        }

        CreateTargetingDemonstrationArea(ctx, identityString, worldWidth, worldHeight, baseTerrain);
        CreateAimingDemonstrationArea(ctx, identityString, worldWidth, worldHeight, baseTerrain);
        CreateMovementDemonstrationArea(ctx, identityString, worldWidth, worldHeight, baseTerrain);
        CreateEmptyDemonstrationArea(ctx, identityString, worldWidth, worldHeight, baseTerrain);

        var game = new World
        {
            Id = identityString,
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = worldWidth,
            Height = worldHeight,
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing,
            IsHomeGame = true
        };

        ctx.Db.ScheduledTankUpdates.Insert(new TankUpdater.ScheduledTankUpdates
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
            GameId = identityString,
            LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            TickCount = 0
        });

        ctx.Db.ScheduledProjectileUpdates.Insert(new ProjectileUpdater.ScheduledProjectileUpdates
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
            GameId = identityString,
            LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        });

        ctx.Db.ScheduledAIUpdate.Insert(new BehaviorTreeAI.ScheduledAIUpdate
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = AI_UPDATE_INTERVAL_MICROS }),
            GameId = identityString,
            TickCount = 0
        });

        ctx.Db.ScheduledPickupSpawn.Insert(new PickupSpawner.ScheduledPickupSpawn
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = 8_000_000 }),
            GameId = identityString
        });

        ctx.Db.game.Insert(game);

        var random = new Random((int)ctx.Timestamp.MicrosecondsSinceUnixEpoch);

        for (int i = 0; i < 15; i++)
        {
            int rx = random.Next(worldWidth);
            int ry = random.Next(worldHeight);
            int rIndex = ry * worldWidth + rx;
            if (traversibilityMap[rIndex] && (Math.Abs(rx - worldWidth / 2) > 5 || Math.Abs(ry - worldHeight / 2) > 5) && !IsInsideAnyPen(rx, ry))
            {
                traversibilityMap[rIndex] = false;
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
            int tx = random.Next(worldWidth);
            int ty = random.Next(worldHeight);
            int tIndex = ty * worldWidth + tx;
            if (traversibilityMap[tIndex] && (Math.Abs(tx - worldWidth / 2) > 5 || Math.Abs(ty - worldHeight / 2) > 5) && !IsInsideAnyPen(tx, ty))
            {
                traversibilityMap[tIndex] = false;
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

        ctx.Db.traversibility_map.Insert(new TraversibilityMap
        {
            GameId = identityString,
            Map = traversibilityMap,
            Width = worldWidth,
            Height = worldHeight
        });

        Log.Info($"Created homegame for identity {identityString}");
    }

    private static void SpawnTurretBot(ReducerContext ctx, string gameId, int x, int y, int alliance, AiConfig? aiConfig = null)
    {
        var targetCode = AllocateTargetCode(ctx, gameId) ?? "Turret";
        var (turretBot, turretTransform) = BuildTank(
            ctx: ctx,
            id: GenerateId(ctx, "enmy"),
            gameId: gameId,
            owner: Identity.From(new byte[32]),
            name: "",
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
            name: "",
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
            name: "",
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

    private static void CreateTargetingDemonstrationArea(ReducerContext ctx, string gameId, int worldWidth, int worldHeight, BaseTerrain[] baseTerrain)
    {
        int areaX = 20;
        int areaY = 6;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateCheckeredArea(ctx, gameId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight, baseTerrain);

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
            label: "Use [color=#fceba8]`target <code>`[/color] to lock onto an enemy, then [color=#fceba8]`fire`[/color] to shoot",
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

    private static void CreateAimingDemonstrationArea(ReducerContext ctx, string gameId, int worldWidth, int worldHeight, BaseTerrain[] baseTerrain)
    {
        int areaX = 5;
        int areaY = 14;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateCheckeredArea(ctx, gameId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight, baseTerrain);

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

    private static void CreateMovementDemonstrationArea(ReducerContext ctx, string gameId, int worldWidth, int worldHeight, BaseTerrain[] baseTerrain)
    {
        int areaX = 5;
        int areaY = 6;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateCheckeredArea(ctx, gameId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight, baseTerrain);

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

    private static void CreateEmptyDemonstrationArea(ReducerContext ctx, string gameId, int worldWidth, int worldHeight, BaseTerrain[] baseTerrain)
    {
        int areaX = 20;
        int areaY = 14;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateCheckeredArea(ctx, gameId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight, baseTerrain);

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
            label: "Use shorthands, for example: [color=#fceba8]`f`[/color] for fire, [color=#fceba8]`t <code>`[/color] for target",
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

    private static void CreateCheckeredArea(ReducerContext ctx, string gameId, int worldWidth, int worldHeight, int startX, int startY, int width, int height, BaseTerrain[] baseTerrain)
    {
        for (int y = startY; y < startY + height; y++)
        {
            for (int x = startX; x < startX + width; x++)
            {
                if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight)
                {
                    int index = y * worldWidth + x;
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
