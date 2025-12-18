using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const float SPAWN_PADDING_RATIO = 0.25f;
    private const int MAX_SPAWN_ATTEMPTS = 100;
    private const int HOMEWORLD_SIZE = 20;
    private const float GRID_POSITION_TOLERANCE = 0.0001f;

    public static int GetGridPosition(float position)
    {
        return (int)Math.Floor(position + GRID_POSITION_TOLERANCE);
    }

    public static Tank RespawnTank(ReducerContext ctx, Tank tank, string worldId, int alliance, bool resetKills = false)
    {
        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(worldId);
        if (traversibilityMap == null)
        {
            return tank;
        }

        var (spawnX, spawnY) = FindSpawnPosition(ctx, traversibilityMap.Value, alliance, ctx.Rng);

        var respawnedTank = tank with
        {
            Alliance = alliance,
            Health = TANK_HEALTH,
            MaxHealth = TANK_HEALTH,
            Kills = resetKills ? 0 : tank.Kills,
            PositionX = spawnX,
            PositionY = spawnY,
            Path = [],
            Velocity = new Vector2Float(0, 0),
            BodyAngularVelocity = 0,
            TurretAngularVelocity = 0,
            Target = null,
            TargetLead = 0.0f,
            Guns = [BASE_GUN],
            SelectedGunIndex = 0
        };

        return respawnedTank;
    }

    private static void CreateHomeworld(ReducerContext ctx, string identityString)
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

        ctx.Db.traversibility_map.Insert(new TraversibilityMap
        {
            WorldId = identityString,
            Map = traversibilityMap,
            Width = worldSize,
            Height = worldSize
        });

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
            PositionX = worldSize / 2,
            PositionY = 5,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "Welcome to Command Line Tanks"
        });

        var instructionSignId = GenerateId(ctx, "td");
        ctx.Db.terrain_detail.Insert(new TerrainDetail
        {
            Id = instructionSignId,
            WorldId = identityString,
            PositionX = worldSize / 2,
            PositionY = 6,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "When you're ready to find a game, call the findgame command"
        });

        Log.Info($"Created homeworld for identity {identityString}");
    }

    private static Tank BuildTank(ReducerContext ctx, string worldId, Identity owner, string name, string joinCode, int alliance, float positionX, float positionY, bool isBot = false)
    {
        var tankId = GenerateId(ctx, "tnk");
        return new Tank
        {
            Id = tankId,
            WorldId = worldId,
            Owner = owner,
            Name = name,
            JoinCode = joinCode,
            IsBot = isBot,
            Alliance = alliance,
            Health = Module.TANK_HEALTH,
            MaxHealth = Module.TANK_HEALTH,
            Kills = 0,
            CollisionRegionX = 0,
            CollisionRegionY = 0,
            Target = null,
            TargetLead = 0.0f,
            Path = [],
            PositionX = positionX,
            PositionY = positionY,
            BodyRotation = 0.0f,
            TurretRotation = 0.0f,
            TargetTurretRotation = 0.0f,
            TopSpeed = 3f,
            BodyRotationSpeed = 3f,
            TurretRotationSpeed = 3f,
            Guns = [BASE_GUN],
            SelectedGunIndex = 0
        };
    }

    public static (float, float) FindSpawnPosition(ReducerContext ctx, World world, int alliance, Random random)
    {
        var traversibilityMapQuery = ctx.Db.traversibility_map.WorldId.Find(world.Id);
        if (traversibilityMapQuery == null) return (0, 0);
        return FindSpawnPosition(ctx, traversibilityMapQuery.Value, alliance, random);
    }

    public static (float, float) FindSpawnPosition(ReducerContext ctx, TraversibilityMap traversibilityMap, int alliance, Random random)
    {
        int worldWidth = traversibilityMap.Width;
        int worldHeight = traversibilityMap.Height;

        int halfWidth = worldWidth / 2;
        int paddingX = (int)(halfWidth * SPAWN_PADDING_RATIO);
        int paddingY = (int)(worldHeight * SPAWN_PADDING_RATIO);

        int minX, maxX, minY, maxY;

        if (alliance == 0)
        {
            minX = paddingX;
            maxX = halfWidth - paddingX;
        }
        else if (alliance == 1)
        {
            minX = halfWidth + paddingX;
            maxX = worldWidth - paddingX;
        }
        else
        {
            minX = paddingX;
            maxX = halfWidth - paddingX;
        }

        minY = paddingY;
        maxY = worldHeight - paddingY;

        for (int attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++)
        {
            int x = minX;
            int y = minY;

            if (maxX > minX)
            {
                x = minX + random.Next(maxX - minX);
            }

            if (maxY > minY)
            {
                y = minY + random.Next(maxY - minY);
            }

            int index = y * worldWidth + x;
            if (index < traversibilityMap.Map.Length && traversibilityMap.Map[index])
            {
                return (x, y);
            }
        }

        float centerX = (minX + maxX) / 2.0f;
        float centerY = (minY + maxY) / 2.0f;
        return (centerX, centerY);
    }

    private static void CreateProjectile(ReducerContext ctx, Tank tank, float startX, float startY, float angle, Gun gun)
    {
        float velocityX = (float)Math.Cos(angle) * PROJECTILE_SPEED;
        float velocityY = (float)Math.Sin(angle) * PROJECTILE_SPEED;

        var projectileId = GenerateId(ctx, "prj");
        var projectile = new Projectile
        {
            Id = projectileId,
            WorldId = tank.WorldId,
            ShooterTankId = tank.Id,
            Alliance = tank.Alliance,
            PositionX = startX,
            PositionY = startY,
            Speed = PROJECTILE_SPEED,
            Size = PROJECTILE_SIZE,
            Velocity = new Vector2Float(velocityX, velocityY),
            Damage = gun.Damage,
            TrackingStrength = gun.TrackingStrength,
            ProjectileType = gun.ProjectileType,
            SpawnedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            LifetimeSeconds = gun.LifetimeSeconds,
            ReturnsToShooter = gun.ProjectileType == ProjectileType.Boomerang,
            IsReturning = false,
            MaxCollisions = gun.MaxCollisions,
            CollisionCount = 0,
            PassThroughTerrain = gun.PassThroughTerrain
        };

        ctx.Db.projectile.Insert(projectile);
    }

    public static void InitializePickupSpawner(ReducerContext ctx, string worldId, int initialPickupCount)
    {
        ctx.Db.ScheduledPickupSpawn.Insert(new PickupSpawner.ScheduledPickupSpawn
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = 15_000_000 }),
            WorldId = worldId
        });

        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(worldId);
        if (traversibilityMap == null) return;

        int spawnedCount = 0;
        int maxAttempts = 500;

        for (int attempt = 0; attempt < maxAttempts && spawnedCount < initialPickupCount; attempt++)
        {
            if (TrySpawnPickup(ctx, worldId, traversibilityMap.Value))
            {
                spawnedCount++;
            }
        }

        Log.Info($"Initialized {spawnedCount} pickups for world {worldId}");
    }

    public static bool TrySpawnPickup(ReducerContext ctx, string worldId, TraversibilityMap traversibilityMap)
    {
        var (spawnX, spawnY) = GenerateNormalDistributedPosition(
            ctx.Rng, 
            traversibilityMap.Width, 
            traversibilityMap.Height
        );

        if (spawnX < 0 || spawnX >= traversibilityMap.Width || spawnY < 0 || spawnY >= traversibilityMap.Height)
            return false;

        int tileIndex = spawnY * traversibilityMap.Width + spawnX;
        if (tileIndex >= traversibilityMap.Map.Length || !traversibilityMap.Map[tileIndex])
            return false;

        var existingDetail = ctx.Db.terrain_detail.WorldId_PositionX_PositionY.Filter((worldId, spawnX, spawnY));
        foreach (var detail in existingDetail)
        {
            return false;
        }

        var existingPickup = ctx.Db.pickup.WorldId_PositionX_PositionY.Filter((worldId, spawnX, spawnY));
        foreach (var p in existingPickup)
        {
            return false;
        }

        int pickupTypeIndex = ctx.Rng.Next(PICKUP_TYPES.Length);
        TerrainDetailType pickupType = PICKUP_TYPES[pickupTypeIndex];

        var pickupId = GenerateId(ctx, "pickup");
        ctx.Db.pickup.Insert(new Pickup
        {
            Id = pickupId,
            WorldId = worldId,
            PositionX = spawnX,
            PositionY = spawnY,
            Type = pickupType
        });

        Log.Info($"Spawned {pickupType} at ({spawnX}, {spawnY}) in world {worldId}");
        return true;
    }

    public static (int x, int y) GenerateNormalDistributedPosition(Random random, int width, int height)
    {
        float centerX = width / 2.0f;
        float stdDevX = width / 6.0f;

        float normalX = PickupSpawner.GenerateNormalDistribution(random);
        int spawnX = (int)Math.Round(centerX + normalX * stdDevX);
        int spawnY = random.Next(height);

        return (spawnX, spawnY);
    }

    public static bool HasAnyTanksInWorld(ReducerContext ctx, string worldId)
    {
        return ctx.Db.tank.WorldId.Filter(worldId).Any();
    }

    public static void StopWorldTickers(ReducerContext ctx, string worldId)
    {
        foreach (var tankUpdater in ctx.Db.ScheduledTankUpdates.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledTankUpdates.ScheduledId.Delete(tankUpdater.ScheduledId);
        }

        foreach (var projectileUpdater in ctx.Db.ScheduledProjectileUpdates.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledProjectileUpdates.ScheduledId.Delete(projectileUpdater.ScheduledId);
        }

        Log.Info($"Stopped tickers for world {worldId}");
    }

    public static void StartWorldTickers(ReducerContext ctx, string worldId)
    {
        if (!ctx.Db.ScheduledTankUpdates.WorldId.Filter(worldId).Any())
        {
            ctx.Db.ScheduledTankUpdates.Insert(new TankUpdater.ScheduledTankUpdates
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
                WorldId = worldId,
                LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
            });
        }

        if (!ctx.Db.ScheduledProjectileUpdates.WorldId.Filter(worldId).Any())
        {
            ctx.Db.ScheduledProjectileUpdates.Insert(new ProjectileUpdater.ScheduledProjectileUpdates
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
                WorldId = worldId,
                LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
            });
        }

        Log.Info($"Started tickers for world {worldId}");
    }
}
