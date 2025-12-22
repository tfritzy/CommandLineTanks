using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const int HOMEWORLD_SIZE = 40;

    public static void CreateHomeworld(ReducerContext ctx, string identityString)
    {
        int worldSize = HOMEWORLD_SIZE;
        int totalTiles = worldSize * worldSize;

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
            Width = worldSize,
            Height = worldSize,
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing
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
                ctx.Db.terrain_detail.Insert(new TerrainDetail
                {
                    Id = GenerateId(ctx, "td"),
                    WorldId = identityString,
                    PositionX = rx + 0.5f,
                    PositionY = ry + 0.5f,
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
                ctx.Db.terrain_detail.Insert(new TerrainDetail
                {
                    Id = GenerateId(ctx, "td"),
                    WorldId = identityString,
                    PositionX = tx + 0.5f,
                    PositionY = ty + 0.5f,
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
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "When you're ready to find a game, call the findgame command",
            Rotation = 0
        });

        var targetDummyPositions = new[] { (15, 15), (25, 15), (15, 25), (25, 25) };
        foreach (var (x, y) in targetDummyPositions)
        {
            var targetDummyId = GenerateId(ctx, "td");
            traversibilityMap[y * worldSize + x] = false;
            ctx.Db.terrain_detail.Insert(new TerrainDetail
            {
                Id = targetDummyId,
                WorldId = identityString,
                PositionX = x + 0.5f,
                PositionY = y + 0.5f,
                Type = TerrainDetailType.TargetDummy,
                Health = 100_000,
                Rotation = 0
            });
        }

        var pickups = new[]
        {
            TerrainDetailType.TripleShooterPickup,
            TerrainDetailType.MissileLauncherPickup,
            TerrainDetailType.HealthPickup,
            TerrainDetailType.BoomerangPickup,
            TerrainDetailType.GrenadePickup,
            TerrainDetailType.RocketPickup,
            TerrainDetailType.MoagPickup
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
                    Type = pickups[i]
                });
            }
        }

        ctx.Db.traversibility_map.Insert(new TraversibilityMap
        {
            WorldId = identityString,
            Map = traversibilityMap,
            Width = worldSize,
            Height = worldSize
        });

        Log.Info($"Created homeworld for identity {identityString}");
    }
}
