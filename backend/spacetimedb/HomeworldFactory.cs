using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const int HOMEWORLD_SIZE = 40;

    private static void CreateHomeworld(ReducerContext ctx, string identityString)
    {
        int worldSize = HOMEWORLD_SIZE;
        int totalTiles = worldSize * worldSize;

        var baseTerrain = new BaseTerrain[totalTiles];
        var traversibilityMap = new bool[totalTiles];
        var projectileCollisionMap = new bool[totalTiles];

        for (int i = 0; i < totalTiles; i++)
        {
            baseTerrain[i] = BaseTerrain.Ground;
            traversibilityMap[i] = true;
            projectileCollisionMap[i] = true;
        }

        var world = new World
        {
            Id = identityString,
            Name = $"Homeworld",
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = worldSize,
            Height = worldSize,
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing,
            IsHomeWorld = true
        };

        ctx.Db.ScheduledTankUpdates.Insert(new TankUpdater.ScheduledTankUpdates
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
            WorldId = identityString,
            LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
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

        ctx.Db.world.Insert(world);

        var random = new Random((int)ctx.Timestamp.MicrosecondsSinceUnixEpoch);

        for (int i = 0; i < 15; i++)
        {
            int rx = random.Next(worldSize);
            int ry = random.Next(worldSize);
            int rIndex = ry * worldSize + rx;
            if (traversibilityMap[rIndex] && (Math.Abs(rx - 20) > 5 || Math.Abs(ry - 20) > 5))
            {
                traversibilityMap[rIndex] = false;
                projectileCollisionMap[rIndex] = false;
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
            int tx = random.Next(worldSize);
            int ty = random.Next(worldSize);
            int tIndex = ty * worldSize + tx;
            if (traversibilityMap[tIndex] && (Math.Abs(tx - 20) > 5 || Math.Abs(ty - 20) > 5))
            {
                traversibilityMap[tIndex] = false;
                projectileCollisionMap[tIndex] = false;
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
            PositionX = worldSize / 2.0f + 0.5f,
            PositionY = 5.5f,
            GridX = worldSize / 2,
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
            PositionX = worldSize / 2.0f + 0.5f,
            PositionY = 6.5f,
            GridX = worldSize / 2,
            GridY = 6,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "When you're ready to find a game, call the findgame command",
            Rotation = 0
        });

        var enemyTankPositions = new[] { (15, 15), (25, 15), (15, 25), (25, 25) };
        int tankIndex = 0;
        foreach (var (x, y) in enemyTankPositions)
        {
            if (tankIndex == 0)
            {
                SpawnRandomAimTankWithDummies(ctx, identityString, x, y, worldSize);
            }
            else
            {
                SpawnTileboundTank(ctx, identityString, x, y);
            }
            tankIndex++;
        }

        SpawnTurretDemonstrationArea(ctx, identityString, 10, 30);

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
            int px = 20 - (pickups.Length / 2) + i;

            for (int row = 0; row < 10; row++)
            {
                int py = 25 + row;

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
        }

        ctx.Db.traversibility_map.Insert(new TraversibilityMap
        {
            WorldId = identityString,
            Map = traversibilityMap,
            ProjectileCollisionMap = projectileCollisionMap,
            Width = worldSize,
            Height = worldSize
        });

        Log.Info($"Created homeworld for identity {identityString}");
    }

    private static void SpawnRandomAimTankWithDummies(ReducerContext ctx, string worldId, int x, int y, int worldSize)
    {
        var tankName = AllocateTankName(ctx, worldId) ?? "Enemy";
        var enemyTank = BuildTank(
            ctx,
            worldId,
            Identity.From(new byte[32]),
            tankName,
            "",
            0,
            x + 0.5f,
            y + 0.5f,
            AIBehavior.RandomAim
        );
        enemyTank.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(enemyTank);
    }

    private static void SpawnTileboundTank(ReducerContext ctx, string worldId, int x, int y)
    {
        var tankName = AllocateTankName(ctx, worldId) ?? "Enemy";
        var enemyTank = BuildTank(
            ctx,
            worldId,
            Identity.From(new byte[32]),
            tankName,
            "",
            1,
            x + 0.5f,
            y + 0.5f,
            AIBehavior.Tilebound
        );
        enemyTank.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(enemyTank);
    }

    private static void SpawnTurretDemonstrationArea(ReducerContext ctx, string worldId, int centerX, int centerY)
    {
        var turretName = AllocateTankName(ctx, worldId) ?? "Turret";
        var turretTank = BuildTank(
            ctx,
            worldId,
            Identity.From(new byte[32]),
            turretName,
            "",
            0,
            centerX + 0.5f,
            centerY + 0.5f,
            AIBehavior.Turret
        );
        turretTank.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(turretTank);

        var tileboundPositions = new[] { (centerX + 2, centerY + 2), (centerX + 3, centerY + 3) };
        foreach (var (x, y) in tileboundPositions)
        {
            SpawnTileboundTank(ctx, worldId, x, y);
        }

        ctx.Db.terrain_detail.Insert(new TerrainDetail
        {
            Id = GenerateId(ctx, "td"),
            WorldId = worldId,
            PositionX = centerX + 0.5f,
            PositionY = centerY - 2.5f,
            GridX = centerX,
            GridY = centerY - 2,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "Turret AI Demo",
            Rotation = 0
        });
    }
}
