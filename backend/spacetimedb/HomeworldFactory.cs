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
            if (traversibilityMap[rIndex] && (Math.Abs(rx - worldWidth/2) > 5 || Math.Abs(ry - worldHeight/2) > 5))
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
            int tx = random.Next(worldWidth);
            int ty = random.Next(worldHeight);
            int tIndex = ty * worldWidth + tx;
            if (traversibilityMap[tIndex] && (Math.Abs(tx - worldWidth/2) > 5 || Math.Abs(ty - worldHeight/2) > 5))
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

        SpawnTurretBot(ctx, identityString, 5, worldHeight / 2);
        SpawnRandomAimBot(ctx, identityString, worldWidth - 5, worldHeight / 2);

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
            int px = worldWidth/2 - pickups.Length + (i * 2);
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
            ProjectileCollisionMap = projectileCollisionMap,
            Width = worldWidth,
            Height = worldHeight
        });

        Log.Info($"Created homeworld for identity {identityString}");
    }

    private static void SpawnTurretBot(ReducerContext ctx, string worldId, int x, int y)
    {
        var tankName = AllocateTankName(ctx, worldId) ?? "Turret";
        var turretBot = BuildTank(
            ctx,
            worldId,
            Identity.From(new byte[32]),
            tankName,
            "",
            0,
            x + 0.5f,
            y + 0.5f,
            AIBehavior.Turret
        );
        turretBot.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(turretBot);
    }

    private static void SpawnRandomAimBot(ReducerContext ctx, string worldId, int x, int y)
    {
        var tankName = AllocateTankName(ctx, worldId) ?? "AimBot";
        var aimBot = BuildTank(
            ctx,
            worldId,
            Identity.From(new byte[32]),
            tankName,
            "",
            1,
            x + 0.5f,
            y + 0.5f,
            AIBehavior.RandomAim
        );
        aimBot.Id = GenerateId(ctx, "enmy");
        ctx.Db.tank.Insert(aimBot);
    }
}
