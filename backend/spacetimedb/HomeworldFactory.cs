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
            Name = $"Homeworld",
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
                ctx.Db.terrain_detail.Insert(new TerrainDetail
                {
                    Id = GenerateId(ctx, "td"),
                    WorldId = identityString,
                    PositionX = rx + 0.5f,
                    PositionY = ry + 0.5f,
                    GridX = rx,
                    GridY = ry,
                    Type = TerrainDetailType.Rock,
                    Health = 100,
                    Rotation = random.Next(4)
                });
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
                ctx.Db.terrain_detail.Insert(new TerrainDetail
                {
                    Id = GenerateId(ctx, "td"),
                    WorldId = identityString,
                    PositionX = tx + 0.5f,
                    PositionY = ty + 0.5f,
                    GridX = tx,
                    GridY = ty,
                    Type = TerrainDetailType.Tree,
                    Health = 100,
                    Rotation = random.Next(4)
                });
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

        var pickups = new[]
        {
            PickupType.TripleShooter,
            PickupType.MissileLauncher,
            PickupType.Health,
            PickupType.Boomerang,
            PickupType.Grenade,
            PickupType.Rocket,
            PickupType.Moag,
            PickupType.Sniper
        };

        for (int i = 0; i < pickups.Length; i++)
        {
            int px = worldWidth / 2 - pickups.Length + (i * 2);
            int py = worldHeight - 5;

            ctx.Db.pickup.Insert(new Pickup
            {
                Id = GenerateId(ctx, "p"),
                WorldId = identityString,
                PositionX = px + 0.5f,
                PositionY = py + 0.5f,
                GridX = px,
                GridY = py,
                Type = pickups[i]
            });
        }

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
        var turretBot = BuildTank(
            ctx,
            worldId,
            Identity.From(new byte[32]),
            "",
            targetCode,
            "",
            alliance,
            x + 0.5f,
            y + 0.5f,
            AIBehavior.Turret,
            aiConfig
        );
        turretBot.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(turretBot);
    }

    private static void SpawnRandomAimBot(ReducerContext ctx, string worldId, int x, int y, int alliance, AiConfig? aiConfig = null)
    {
        var targetCode = AllocateTargetCode(ctx, worldId) ?? "AimBot";
        var aimBot = BuildTank(
            ctx,
            worldId,
            Identity.From(new byte[32]),
            "",
            targetCode,
            "",
            alliance,
            x + 0.5f,
            y + 0.5f,
            AIBehavior.RandomAim,
            aiConfig
        );
        aimBot.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(aimBot);
    }

    private static void SpawnTileboundBot(ReducerContext ctx, string worldId, int x, int y, int alliance, AiConfig? aiConfig = null)
    {
        var targetCode = AllocateTargetCode(ctx, worldId) ?? "TileBot";
        var tileboundBot = BuildTank(
            ctx,
            worldId,
            Identity.From(new byte[32]),
            "",
            targetCode,
            "",
            alliance,
            x + 0.5f,
            y + 0.5f,
            AIBehavior.Tilebound,
            aiConfig
        );
        tileboundBot.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(tileboundBot);
    }

    private static void CreateTargetingDemonstrationArea(ReducerContext ctx, string worldId, int worldWidth, int worldHeight)
    {
        int areaX = 20;
        int areaY = 5;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateFencedArea(ctx, worldId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight);

        ctx.Db.terrain_detail.Insert(new TerrainDetail
        {
            Id = GenerateId(ctx, "td"),
            WorldId = worldId,
            PositionX = areaX + areaWidth / 2.0f + 0.5f,
            PositionY = areaY - 0.8f,
            GridX = areaX + areaWidth / 2,
            GridY = areaY - 1,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "Use [color=#fceba8]`target <code>`[/color] to lock onto an enemy, then [color=#fceba8]`fire`[/color] to shoot",
            Rotation = 0
        });

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
        int areaY = 13;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateFencedArea(ctx, worldId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight);

        ctx.Db.terrain_detail.Insert(new TerrainDetail
        {
            Id = GenerateId(ctx, "td"),
            WorldId = worldId,
            PositionX = areaX + areaWidth / 2.0f + 0.5f,
            PositionY = areaY - 0.8f,
            GridX = areaX + areaWidth / 2,
            GridY = areaY - 1,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "Use [color=#fceba8]`aim <direction>`[/color] to point your turret, then [color=#fceba8]`fire`[/color] to shoot",
            Rotation = 0
        });

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
        int areaY = 5;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateFencedArea(ctx, worldId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight);

        ctx.Db.terrain_detail.Insert(new TerrainDetail
        {
            Id = GenerateId(ctx, "td"),
            WorldId = worldId,
            PositionX = areaX + areaWidth / 2.0f + 0.5f,
            PositionY = areaY - 0.8f,
            GridX = areaX + areaWidth / 2,
            GridY = areaY - 1,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "Use [color=#fceba8]`drive <direction> <distance>`[/color] to move your tank",
            Rotation = 0
        });

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
        int areaY = 13;
        int areaWidth = 5;
        int areaHeight = 5;

        CreateFencedArea(ctx, worldId, worldWidth, worldHeight, areaX, areaY, areaWidth, areaHeight);
    }

    private static void CreateFencedArea(ReducerContext ctx, string worldId, int worldWidth, int worldHeight, int startX, int startY, int width, int height)
    {
        for (int x = startX; x < startX + width; x++)
        {
            int topY = startY - 1;
            if (topY >= 0)
            {
                ctx.Db.terrain_detail.Insert(new TerrainDetail
                {
                    Id = GenerateId(ctx, "td"),
                    WorldId = worldId,
                    PositionX = x + 0.5f,
                    PositionY = topY + 0.5f,
                    GridX = x,
                    GridY = topY,
                    Type = TerrainDetailType.FenceEdge,
                    Health = 100,
                    Rotation = 0
                });
            }

            int bottomY = startY + height;
            if (bottomY < worldHeight)
            {
                ctx.Db.terrain_detail.Insert(new TerrainDetail
                {
                    Id = GenerateId(ctx, "td"),
                    WorldId = worldId,
                    PositionX = x + 0.5f,
                    PositionY = bottomY + 0.5f,
                    GridX = x,
                    GridY = bottomY,
                    Type = TerrainDetailType.FenceEdge,
                    Health = 100,
                    Rotation = 2
                });
            }
        }

        for (int y = startY; y < startY + height; y++)
        {
            int leftX = startX - 1;
            if (leftX >= 0)
            {
                ctx.Db.terrain_detail.Insert(new TerrainDetail
                {
                    Id = GenerateId(ctx, "td"),
                    WorldId = worldId,
                    PositionX = leftX + 0.5f,
                    PositionY = y + 0.5f,
                    GridX = leftX,
                    GridY = y,
                    Type = TerrainDetailType.FenceEdge,
                    Health = 100,
                    Rotation = 3
                });
            }

            int rightX = startX + width;
            if (rightX < worldWidth)
            {
                ctx.Db.terrain_detail.Insert(new TerrainDetail
                {
                    Id = GenerateId(ctx, "td"),
                    WorldId = worldId,
                    PositionX = rightX + 0.5f,
                    PositionY = y + 0.5f,
                    GridX = rightX,
                    GridY = y,
                    Type = TerrainDetailType.FenceEdge,
                    Health = 100,
                    Rotation = 1
                });
            }
        }

        int topLeftX = startX - 1;
        int topLeftY = startY - 1;
        if (topLeftX >= 0 && topLeftY >= 0)
        {
            ctx.Db.terrain_detail.Insert(new TerrainDetail
            {
                Id = GenerateId(ctx, "td"),
                WorldId = worldId,
                PositionX = topLeftX + 0.5f,
                PositionY = topLeftY + 0.5f,
                GridX = topLeftX,
                GridY = topLeftY,
                Type = TerrainDetailType.FenceCorner,
                Health = 100,
                Rotation = 0
            });
        }

        int topRightX = startX + width;
        int topRightY = startY - 1;
        if (topRightX < worldWidth && topRightY >= 0)
        {
            ctx.Db.terrain_detail.Insert(new TerrainDetail
            {
                Id = GenerateId(ctx, "td"),
                WorldId = worldId,
                PositionX = topRightX + 0.5f,
                PositionY = topRightY + 0.5f,
                GridX = topRightX,
                GridY = topRightY,
                Type = TerrainDetailType.FenceCorner,
                Health = 100,
                Rotation = 1
            });
        }

        int bottomLeftX = startX - 1;
        int bottomLeftY = startY + height;
        if (bottomLeftX >= 0 && bottomLeftY < worldHeight)
        {
            ctx.Db.terrain_detail.Insert(new TerrainDetail
            {
                Id = GenerateId(ctx, "td"),
                WorldId = worldId,
                PositionX = bottomLeftX + 0.5f,
                PositionY = bottomLeftY + 0.5f,
                GridX = bottomLeftX,
                GridY = bottomLeftY,
                Type = TerrainDetailType.FenceCorner,
                Health = 100,
                Rotation = 3
            });
        }

        int bottomRightX = startX + width;
        int bottomRightY = startY + height;
        if (bottomRightX < worldWidth && bottomRightY < worldHeight)
        {
            ctx.Db.terrain_detail.Insert(new TerrainDetail
            {
                Id = GenerateId(ctx, "td"),
                WorldId = worldId,
                PositionX = bottomRightX + 0.5f,
                PositionY = bottomRightY + 0.5f,
                GridX = bottomRightX,
                GridY = bottomRightY,
                Type = TerrainDetailType.FenceCorner,
                Health = 100,
                Rotation = 2
            });
        }
    }

    private static bool IsInsideAnyPen(int x, int y)
    {
        // Targeting Area: areaX = 20, areaY = 5, areaWidth = 5, areaHeight = 5
        // Fences are at x=19, x=25, y=4, y=10
        if (x >= 19 && x <= 25 && y >= 4 && y <= 10) return true;

        // Aiming Area: areaX = 5, areaY = 13, areaWidth = 5, areaHeight = 5
        // Fences are at x=4, x=10, y=12, y=18
        if (x >= 4 && x <= 10 && y >= 12 && y <= 18) return true;

        // Movement Area: areaX = 5, areaY = 5, areaWidth = 5, areaHeight = 5
        // Fences are at x=4, x=10, y=4, y=10
        if (x >= 4 && x <= 10 && y >= 4 && y <= 10) return true;

        // Empty Area: areaX = 20, areaY = 13, areaWidth = 5, areaHeight = 5
        // Fences are at x=19, x=25, y=12, y=18
        if (x >= 19 && x <= 25 && y >= 12 && y <= 18) return true;

        return false;
    }
}
