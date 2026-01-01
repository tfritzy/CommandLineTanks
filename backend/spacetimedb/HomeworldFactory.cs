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
            if (traversibilityMap[rIndex] && (Math.Abs(rx - worldWidth / 2) > 5 || Math.Abs(ry - worldHeight / 2) > 5))
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
            if (traversibilityMap[tIndex] && (Math.Abs(tx - worldWidth / 2) > 5 || Math.Abs(ty - worldHeight / 2) > 5))
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

        var welcomeSignId = GenerateId(ctx, "td");
        ctx.Db.terrain_detail.Insert(new TerrainDetail
        {
            Id = welcomeSignId,
            WorldId = identityString,
            PositionX = worldWidth / 2.0f + 0.5f,
            PositionY = 5.5f,
            GridX = worldWidth / 2,
            GridY = 5,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "Welcome to Command Line Tanks",
            Rotation = 0
        });

        var instructionSignId = GenerateId(ctx, "td");
        ctx.Db.terrain_detail.Insert(new TerrainDetail
        {
            Id = instructionSignId,
            WorldId = identityString,
            PositionX = worldWidth / 2.0f + 0.5f,
            PositionY = 6.5f,
            GridX = worldWidth / 2,
            GridY = 6,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "When you're ready to find a game, call the findgame command",
            Rotation = 0
        });

        CreateTargetingDemonstrationArea(ctx, identityString, traversibilityMap, worldWidth, worldHeight);
        CreateAimingDemonstrationArea(ctx, identityString, traversibilityMap, worldWidth, worldHeight);
        CreateMovementDemonstrationArea(ctx, identityString, traversibilityMap, worldWidth, worldHeight);

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

    private static void SpawnTurretBot(ReducerContext ctx, string worldId, int x, int y, int alliance)
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
            AIBehavior.Turret
        );
        turretBot.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(turretBot);
    }

    private static void SpawnRandomAimBot(ReducerContext ctx, string worldId, int x, int y, int alliance)
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
            AIBehavior.RandomAim
        );
        aimBot.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(aimBot);
    }

    private static void SpawnTileboundBot(ReducerContext ctx, string worldId, int x, int y, int alliance)
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
            AIBehavior.Tilebound
        );
        tileboundBot.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(tileboundBot);
    }

    private static void CreateTargetingDemonstrationArea(ReducerContext ctx, string worldId, bool[] traversibilityMap, int worldWidth, int worldHeight)
    {
        int areaX = 0;
        int areaY = 6;
        int areaWidth = 6;
        int areaHeight = 6;

        CreateFencedArea(ctx, worldId, traversibilityMap, worldWidth, areaX, areaY, areaWidth, areaHeight);

        ctx.Db.terrain_detail.Insert(new TerrainDetail
        {
            Id = GenerateId(ctx, "td"),
            WorldId = worldId,
            PositionX = areaX + areaWidth / 2.0f + 0.5f,
            PositionY = areaY - 1.5f,
            GridX = areaX + areaWidth / 2,
            GridY = areaY - 2,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "target <code>, fire",
            Rotation = 0
        });

        SpawnTurretBot(ctx, worldId, areaX + areaWidth / 2, areaY + areaHeight / 2, 0);
        SpawnTileboundBot(ctx, worldId, areaX + 1, areaY + 1, 1);
    }

    private static void CreateAimingDemonstrationArea(ReducerContext ctx, string worldId, bool[] traversibilityMap, int worldWidth, int worldHeight)
    {
        int areaX = 24;
        int areaY = 6;
        int areaWidth = 6;
        int areaHeight = 6;

        CreateFencedArea(ctx, worldId, traversibilityMap, worldWidth, areaX, areaY, areaWidth, areaHeight);

        ctx.Db.terrain_detail.Insert(new TerrainDetail
        {
            Id = GenerateId(ctx, "td"),
            WorldId = worldId,
            PositionX = areaX + areaWidth / 2.0f + 0.5f,
            PositionY = areaY - 1.5f,
            GridX = areaX + areaWidth / 2,
            GridY = areaY - 2,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "aim <direction>, fire",
            Rotation = 0
        });

        SpawnRandomAimBot(ctx, worldId, areaX + areaWidth / 2, areaY + areaHeight / 2, 0);
        SpawnTileboundBot(ctx, worldId, areaX + 1, areaY + 1, 1);
    }

    private static void CreateMovementDemonstrationArea(ReducerContext ctx, string worldId, bool[] traversibilityMap, int worldWidth, int worldHeight)
    {
        int areaX = 12;
        int areaY = 12;
        int areaWidth = 6;
        int areaHeight = 6;

        CreateFencedArea(ctx, worldId, traversibilityMap, worldWidth, areaX, areaY, areaWidth, areaHeight);

        ctx.Db.terrain_detail.Insert(new TerrainDetail
        {
            Id = GenerateId(ctx, "td"),
            WorldId = worldId,
            PositionX = areaX + areaWidth / 2.0f + 0.5f,
            PositionY = areaY - 1.5f,
            GridX = areaX + areaWidth / 2,
            GridY = areaY - 2,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "drive <direction> <distance>",
            Rotation = 0
        });

        SpawnTileboundBot(ctx, worldId, areaX + areaWidth / 2, areaY + areaHeight / 2, 0);
    }

    private static void CreateFencedArea(ReducerContext ctx, string worldId, bool[] traversibilityMap, int worldWidth, int startX, int startY, int width, int height)
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
            if (bottomY < worldWidth)
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
        if (bottomLeftX >= 0 && bottomLeftY < worldWidth)
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
        if (bottomRightX < worldWidth && bottomRightY < worldWidth)
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
}
