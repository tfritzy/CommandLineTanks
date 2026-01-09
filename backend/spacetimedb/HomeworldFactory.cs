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

        var world = new World
        {
            Id = identityString,
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = worldWidth,
            Height = worldHeight,
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing,
            IsHomeWorld = true
        };

        ctx.Db.ScheduledTankUpdates.Insert(new TankUpdater.ScheduledTankUpdates
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
            WorldId = identityString,
            LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            TickCount = 0
        });

        ctx.Db.ScheduledProjectileUpdates.Insert(new ProjectileUpdater.ScheduledProjectileUpdates
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
            WorldId = identityString,
            LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        });

        ctx.Db.ScheduledAIUpdate.Insert(new BehaviorTreeAI.ScheduledAIUpdate
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = AI_UPDATE_INTERVAL_MICROS }),
            WorldId = identityString,
            TickCount = 0
        });

        ctx.Db.ScheduledPickupSpawn.Insert(new PickupSpawner.ScheduledPickupSpawn
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = 8_000_000 }),
            WorldId = identityString
        });

        ctx.Db.world.Insert(world);

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
                    worldId: identityString,
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
                    worldId: identityString,
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
            WorldId = identityString,
            Kills = new int[] { 0, 0 }
        });

        CreateTargetingDemonstrationArea(ctx, identityString, worldWidth, worldHeight);
        CreateAimingDemonstrationArea(ctx, identityString, worldWidth, worldHeight);
        CreateMovementDemonstrationArea(ctx, identityString, worldWidth, worldHeight);
        CreateEmptyDemonstrationArea(ctx, identityString, worldWidth, worldHeight);

        ctx.Db.traversibility_map.Insert(new TraversibilityMap
        {
            WorldId = identityString,
            Map = traversibilityMap,
            Width = worldWidth,
            Height = worldHeight
        });

        Log.Info($"Created homeworld for identity {identityString}");
    }

    private static void SpawnTurretBot(ReducerContext ctx, string worldId, int x, int y, int alliance, AiConfig? aiConfig = null)
    {
        var targetCode = AllocateTargetCode(ctx, worldId) ?? "Turret";
        var (turretBot, turretTransform) = BuildTank(
            ctx: ctx,
            id: GenerateId(ctx, "enmy"),
            worldId: worldId,
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

    private static void SpawnRandomAimBot(ReducerContext ctx, string worldId, int x, int y, int alliance, AiConfig? aiConfig = null)
    {
        var targetCode = AllocateTargetCode(ctx, worldId) ?? "AimBot";
        var (aimBot, aimTransform) = BuildTank(
            ctx: ctx,
            id: GenerateId(ctx, "enmy"),
            worldId: worldId,
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

    private static void SpawnTileboundBot(ReducerContext ctx, string worldId, int x, int y, int alliance, AiConfig? aiConfig = null)
    {
        var targetCode = AllocateTargetCode(ctx, worldId) ?? "TileBot";
        var (tileboundBot, tileboundTransform) = BuildTank(
            ctx: ctx,
            id: GenerateId(ctx, "enmy"),
            worldId: worldId,
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

    private static void CreateTargetingDemonstrationArea(ReducerContext ctx, string worldId, int worldWidth, int worldHeight)
    {
        int areaX = 20;
        int areaY = 6;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateFencedArea(ctx, worldId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight);

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            worldId: worldId,
            positionX: areaX + areaWidth / 2.0f + 0.5f,
            positionY: areaY - 0.8f,
            gridX: areaX + areaWidth / 2,
            gridY: areaY - 1,
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

        SpawnTurretBot(ctx, worldId, areaX + areaWidth / 2, areaY + areaHeight / 2, 0, pen);
        SpawnTileboundBot(ctx, worldId, areaX + 1, areaY + 1, 1, pen);
    }

    private static void CreateAimingDemonstrationArea(ReducerContext ctx, string worldId, int worldWidth, int worldHeight)
    {
        int areaX = 5;
        int areaY = 14;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateFencedArea(ctx, worldId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight);

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            worldId: worldId,
            positionX: areaX + areaWidth / 2.0f + 0.5f,
            positionY: areaY - 0.8f,
            gridX: areaX + areaWidth / 2,
            gridY: areaY - 1,
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

        SpawnRandomAimBot(ctx, worldId, areaX + areaWidth / 2, areaY + areaHeight / 2, 0, pen);
    }

    private static void CreateMovementDemonstrationArea(ReducerContext ctx, string worldId, int worldWidth, int worldHeight)
    {
        int areaX = 5;
        int areaY = 6;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateFencedArea(ctx, worldId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight);

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            worldId: worldId,
            positionX: areaX + areaWidth / 2.0f + 0.5f,
            positionY: areaY - 0.8f,
            gridX: areaX + areaWidth / 2,
            gridY: areaY - 1,
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

        SpawnTileboundBot(ctx, worldId, areaX + areaWidth / 2, areaY + areaHeight / 2, 0, pen);
    }

    private static void CreateEmptyDemonstrationArea(ReducerContext ctx, string worldId, int worldWidth, int worldHeight)
    {
        int areaX = 20;
        int areaY = 14;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateFencedArea(ctx, worldId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight);

        ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
            ctx: ctx,
            worldId: worldId,
            positionX: areaX + areaWidth / 2.0f + 0.5f,
            positionY: areaY - 0.8f,
            gridX: areaX + areaWidth / 2,
            gridY: areaY - 1,
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

        SpawnTileboundBot(ctx, worldId, areaX + 1, areaY + 1, 1, pen);
        SpawnTileboundBot(ctx, worldId, areaX + 3, areaY + 1, 1, pen);
        SpawnTileboundBot(ctx, worldId, areaX + 2, areaY + 3, 1, pen);
    }

    private static void CreateFencedArea(ReducerContext ctx, string worldId, int worldWidth, int worldHeight, int startX, int startY, int width, int height)
    {
        for (int x = startX; x < startX + width; x++)
        {
            int topY = startY - 1;
            if (topY >= 0)
            {
                ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                    ctx: ctx,
                    worldId: worldId,
                    positionX: x + 0.5f,
                    positionY: topY + 0.5f,
                    gridX: x,
                    gridY: topY,
                    type: TerrainDetailType.FenceEdge,
                    health: 100,
                    rotation: 0
                ));
            }

            int bottomY = startY + height;
            if (bottomY < worldHeight)
            {
                ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                    ctx: ctx,
                    worldId: worldId,
                    positionX: x + 0.5f,
                    positionY: bottomY + 0.5f,
                    gridX: x,
                    gridY: bottomY,
                    type: TerrainDetailType.FenceEdge,
                    health: 100,
                    rotation: 2
                ));
            }
        }

        for (int y = startY; y < startY + height; y++)
        {
            int leftX = startX - 1;
            if (leftX >= 0)
            {
                ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                    ctx: ctx,
                    worldId: worldId,
                    positionX: leftX + 0.5f,
                    positionY: y + 0.5f,
                    gridX: leftX,
                    gridY: y,
                    type: TerrainDetailType.FenceEdge,
                    health: 100,
                    rotation: 3
                ));
            }

            int rightX = startX + width;
            if (rightX < worldWidth)
            {
                ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                    ctx: ctx,
                    worldId: worldId,
                    positionX: rightX + 0.5f,
                    positionY: y + 0.5f,
                    gridX: rightX,
                    gridY: y,
                    type: TerrainDetailType.FenceEdge,
                    health: 100,
                    rotation: 1
                ));
            }
        }

        int topLeftX = startX - 1;
        int topLeftY = startY - 1;
        if (topLeftX >= 0 && topLeftY >= 0)
        {
            ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                ctx: ctx,
                worldId: worldId,
                positionX: topLeftX + 0.5f,
                positionY: topLeftY + 0.5f,
                gridX: topLeftX,
                gridY: topLeftY,
                type: TerrainDetailType.FenceCorner,
                health: 100,
                rotation: 0
            ));
        }

        int topRightX = startX + width;
        int topRightY = startY - 1;
        if (topRightX < worldWidth && topRightY >= 0)
        {
            ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                ctx: ctx,
                worldId: worldId,
                positionX: topRightX + 0.5f,
                positionY: topRightY + 0.5f,
                gridX: topRightX,
                gridY: topRightY,
                type: TerrainDetailType.FenceCorner,
                health: 100,
                rotation: 1
            ));
        }

        int bottomLeftX = startX - 1;
        int bottomLeftY = startY + height;
        if (bottomLeftX >= 0 && bottomLeftY < worldHeight)
        {
            ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                ctx: ctx,
                worldId: worldId,
                positionX: bottomLeftX + 0.5f,
                positionY: bottomLeftY + 0.5f,
                gridX: bottomLeftX,
                gridY: bottomLeftY,
                type: TerrainDetailType.FenceCorner,
                health: 100,
                rotation: 3
            ));
        }

        int bottomRightX = startX + width;
        int bottomRightY = startY + height;
        if (bottomRightX < worldWidth && bottomRightY < worldHeight)
        {
            ctx.Db.terrain_detail.Insert(TerrainDetail.Build(
                ctx: ctx,
                worldId: worldId,
                positionX: bottomRightX + 0.5f,
                positionY: bottomRightY + 0.5f,
                gridX: bottomRightX,
                gridY: bottomRightY,
                type: TerrainDetailType.FenceCorner,
                health: 100,
                rotation: 2
            ));
        }
    }

    private static bool IsInsideAnyPen(int x, int y)
    {
        if (x >= 19 && x <= 25 && y >= 5 && y <= 11) return true;

        if (x >= 4 && x <= 10 && y >= 13 && y <= 19) return true;

        if (x >= 4 && x <= 10 && y >= 5 && y <= 11) return true;

        if (x >= 19 && x <= 25 && y >= 13 && y <= 19) return true;

        return false;
    }
}
