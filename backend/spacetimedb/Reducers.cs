using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const float SPAWN_PADDING_RATIO = 0.25f;
    private const int MAX_SPAWN_ATTEMPTS = 100;
    private const int HOMEWORLD_SIZE = 20;

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
            Map = traversibilityMap
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
            PositionY = worldSize / 2 + 3,
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
            PositionY = worldSize / 2 + 1,
            Type = TerrainDetailType.Label,
            Health = 100,
            Label = "When you're ready to find a game, call the findgame command"
        });

        Log.Info($"Created homeworld for identity {identityString}");
    }

    public static (float, float) FindSpawnPosition(ReducerContext ctx, World world, int alliance, Random random)
    {
        int worldWidth = world.Width;
        int worldHeight = world.Height;

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

        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(world.Id).Value;

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

    [Reducer(ReducerKind.Init)]
    public static void Init(ReducerContext ctx)
    {
        var worldId = GenerateId(ctx, "wld");

        var (baseTerrain, terrainDetails) = TerrainGenerator.GenerateTerrain(ctx.Rng);
        var terrainDetailArray = TerrainGenerator.ConvertToArray(
            terrainDetails, 
            TerrainGenerator.GetWorldWidth(), 
            TerrainGenerator.GetWorldHeight()
        );
        var traversibilityMap = TerrainGenerator.CalculateTraversibility(baseTerrain, terrainDetailArray);

        var world = new World
        {
            Id = worldId,
            Name = "Default World",
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = TerrainGenerator.GetWorldWidth(),
            Height = TerrainGenerator.GetWorldHeight(),
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing
        };

        ctx.Db.ScheduledTankUpdates.Insert(new TankUpdater.ScheduledTankUpdates
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
            WorldId = worldId,
            LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        });

        ctx.Db.ScheduledProjectileUpdates.Insert(new ProjectileUpdater.ScheduledProjectileUpdates
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
            WorldId = worldId,
            LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        });

        ctx.Db.world.Insert(world);

        foreach (var detail in terrainDetails)
        {
            var terrainDetailId = GenerateId(ctx, "td");
            ctx.Db.terrain_detail.Insert(new TerrainDetail
            {
                Id = terrainDetailId,
                WorldId = worldId,
                PositionX = detail.x,
                PositionY = detail.y,
                Type = detail.type,
                Health = 100,
                Label = null
            });
        }

        ctx.Db.traversibility_map.Insert(new TraversibilityMap
        {
            WorldId = worldId,
            Map = traversibilityMap
        });

        ctx.Db.score.Insert(new Score
        {
            WorldId = worldId,
            Kills = new int[] { 0, 0 }
        });

        Log.Info($"Initialized world {worldId}");
    }

    [Reducer(ReducerKind.ClientConnected)]
    public static void HandleConnect(ReducerContext ctx)
    {
        var existingPlayer = ctx.Db.player.Identity.Find(ctx.Sender);

        if (existingPlayer != null)
        {
            Log.Info($"Player {existingPlayer.Value.Name} reconnected");
        }
        else
        {
            var playerId = GenerateId(ctx, "plr");
            var player = new Player
            {
                Id = playerId,
                Identity = ctx.Sender,
                Name = $"Player_{playerId}",
                CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
            };

            ctx.Db.player.Insert(player);
            Log.Info($"New player connected with ID {playerId}");
        }

        var identityString = ctx.Sender.ToHexString();
        var existingHomeworld = ctx.Db.world.Id.Find(identityString);
        if (existingHomeworld == null)
        {
            CreateHomeworld(ctx, identityString);
        }
    }

    [Reducer(ReducerKind.ClientDisconnected)]
    public static void HandleDisconnect(ReducerContext ctx)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            return;
        }

        Tank tank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (!string.IsNullOrEmpty(tank.Id))
        {
            ctx.Db.tank.Id.Delete(tank.Id);
            Log.Info($"Player {player.Value.Name} disconnected, removed tank {tank.Id} named {tank.Name ?? "Unknown"}");
        }
    }

    [Reducer]
    public static void drive(ReducerContext ctx, Vector2 offset, float throttle, bool append)
    {
        Tank? maybeTank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.IsDead) return;

        Vector2 rootPos = tank.Path.Length > 0 && append ? tank.Path[^1].Position : new Vector2((int)tank.PositionX, (int)tank.PositionY);
        Vector2 nextPos = new(rootPos.X + offset.X, rootPos.Y + offset.Y);
        Log.Info(tank + " driving to " + nextPos + ". because " + rootPos + " and " + offset);

        PathEntry entry = new()
        {
            ThrottlePercent = throttle,
            Position = nextPos,
            Reverse = false
        };

        if (append)
        {
            tank.Path = [.. tank.Path, entry];
        }
        else
        {
            tank.Path = [entry];
        }

        ctx.Db.tank.Id.Update(tank);
    }

    [Reducer]
    public static void reverse(ReducerContext ctx, float distance)
    {
        Tank? maybeTank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.IsDead) return;

        Vector2 rootPos = new Vector2((int)tank.PositionX, (int)tank.PositionY);

        float angle = tank.BodyRotation;
        int offsetX = (int)Math.Round(-Math.Cos(angle) * distance);
        int offsetY = (int)Math.Round(-Math.Sin(angle) * distance);

        Vector2 nextPos = new(rootPos.X + offsetX, rootPos.Y + offsetY);
        Log.Info(tank + " reversing to " + nextPos + ". because " + rootPos + " and offset (" + offsetX + ", " + offsetY + ")");

        PathEntry entry = new()
        {
            ThrottlePercent = 1.0f,
            Position = nextPos,
            Reverse = true
        };

        tank.Path = [entry];
        ctx.Db.tank.Id.Update(tank);
    }

    [Reducer]
    public static void stop(ReducerContext ctx)
    {
        Tank? maybeTank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.IsDead) return;

        tank.Path = [];
        tank.Velocity = new Vector2Float(0, 0);
        tank.BodyAngularVelocity = 0;
        ctx.Db.tank.Id.Update(tank);
        Log.Info($"Tank {tank.Name} stopped");
    }

    [Reducer]
    public static void aim(ReducerContext ctx, float angleRadians)
    {
        Tank tank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (tank.Id == null) return;

        if (tank.IsDead) return;

        tank.TargetTurretRotation = angleRadians;
        tank.Target = null;
        ctx.Db.tank.Id.Update(tank);
    }

    [Reducer]
    public static void targetTank(ReducerContext ctx, string targetName, float lead)
    {
        Tank tank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (tank.Id == null) return;

        if (tank.IsDead) return;

        var targetNameLower = targetName.ToLower();
        var targetTank = ctx.Db.tank.WorldId_Name.Filter((tank.WorldId, targetNameLower)).FirstOrDefault();

        if (targetTank.Id == null)
        {
            return;
        }

        tank.Target = targetTank.Id;
        tank.TargetLead = lead;
        ctx.Db.tank.Id.Update(tank);
    }

    [Reducer]
    public static void fire(ReducerContext ctx)
    {
        Tank? maybeTank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.IsDead) return;

        if (tank.SelectedGunIndex < 0 || tank.SelectedGunIndex >= tank.Guns.Length) return;

        var gun = tank.Guns[tank.SelectedGunIndex];

        if (gun.Ammo != null && gun.Ammo <= 0) return;

        float barrelTipX = tank.PositionX + (float)Math.Cos(tank.TurretRotation) * GUN_BARREL_LENGTH;
        float barrelTipY = tank.PositionY + (float)Math.Sin(tank.TurretRotation) * GUN_BARREL_LENGTH;

        if (gun.ProjectileCount == 1)
        {
            CreateProjectile(ctx, tank, barrelTipX, barrelTipY, tank.TurretRotation, gun.Damage, gun.TrackingStrength, gun.ProjectileType);
        }
        else
        {
            float halfSpread = gun.SpreadAngle * (gun.ProjectileCount - 1) / 2.0f;
            for (int i = 0; i < gun.ProjectileCount; i++)
            {
                float angle = tank.TurretRotation - halfSpread + (i * gun.SpreadAngle);
                CreateProjectile(ctx, tank, barrelTipX, barrelTipY, angle, gun.Damage, gun.TrackingStrength, gun.ProjectileType);
            }
        }

        if (gun.Ammo != null)
        {
            gun.Ammo = gun.Ammo.Value - 1;
            var updatedGuns = tank.Guns.ToArray();

            if (gun.Ammo <= 0)
            {
                tank.Guns = tank.Guns.Where((_, index) => index != tank.SelectedGunIndex).ToArray();
                if (tank.Guns.Length > 0)
                {
                    tank.SelectedGunIndex = 0;
                }
                else
                {
                    tank.SelectedGunIndex = -1;
                }
            }
            else
            {
                updatedGuns[tank.SelectedGunIndex] = gun;
                tank.Guns = updatedGuns;
            }

            ctx.Db.tank.Id.Update(tank);
        }

        Log.Info($"Tank {tank.Name} fired {gun.GunType}. Ammo remaining: {gun.Ammo?.ToString() ?? "unlimited"}");
    }

    private static void CreateProjectile(ReducerContext ctx, Tank tank, float startX, float startY, float angle, int damage, float trackingStrength, ProjectileType projectileType)
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
            Damage = damage,
            TrackingStrength = trackingStrength,
            ProjectileType = projectileType
        };

        ctx.Db.projectile.Insert(projectile);
    }

    [Reducer]
    public static void findWorld(ReducerContext ctx, string joinCode)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        World? world = null;
        foreach (var w in ctx.Db.world.Iter())
        {
            world = w;
            break;
        }

        if (world == null)
        {
            Log.Error("No worlds available");
            return;
        }

        Tank existingTank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (!string.IsNullOrEmpty(existingTank.Id))
        {
            return;
        }

        var tankName = AllocateTankName(ctx, world.Value.Id);
        if (tankName == null)
        {
            Log.Error($"No available tank names in world {world.Value.Name}");
            return;
        }

        int alliance0Count = 0;
        int alliance1Count = 0;
        foreach (var t in ctx.Db.tank.WorldId.Filter(world.Value.Id))
        {
            if (t.Alliance == 0)
            {
                alliance0Count++;
            }
            else if (t.Alliance == 1)
            {
                alliance1Count++;
            }
        }

        int assignedAlliance = alliance0Count <= alliance1Count ? 0 : 1;

        var (spawnX, spawnY) = FindSpawnPosition(ctx, world.Value, assignedAlliance, ctx.Rng);

        var tankId = GenerateId(ctx, "tnk");
        var tank = new Tank
        {
            Id = tankId,
            WorldId = world.Value.Id,
            Owner = ctx.Sender,
            Name = tankName,
            JoinCode = joinCode,
            Alliance = assignedAlliance,
            Health = Module.TANK_HEALTH,
            IsDead = false,
            Kills = 0,
            CollisionRegionX = 0,
            CollisionRegionY = 0,
            Target = null,
            TargetLead = 0.0f,
            Path = [],
            PositionX = spawnX,
            PositionY = spawnY,
            BodyRotation = 0.0f,
            TurretRotation = 0.0f,
            TargetTurretRotation = 0.0f,
            TopSpeed = 3f,
            BodyRotationSpeed = 3f,
            TurretRotationSpeed = 3f,
            Guns = [BASE_GUN],
            SelectedGunIndex = 0
        };

        ctx.Db.tank.Insert(tank);
        Log.Info($"Player {player.Value.Name} joined world {world.Value.Name} with tank {tankId} named {tankName} (joinCode: {joinCode})");
    }

    [Reducer]
    public static void respawn(ReducerContext ctx)
    {
        Tank? maybeTank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (!tank.IsDead) return;

        World? maybeWorld = ctx.Db.world.Id.Find(tank.WorldId);
        if (maybeWorld == null) return;
        var world = maybeWorld.Value;

        var (spawnX, spawnY) = FindSpawnPosition(ctx, world, tank.Alliance, ctx.Rng);

        var respawnedTank = tank with
        {
            Health = Module.TANK_HEALTH,
            IsDead = false,
            PositionX = spawnX,
            PositionY = spawnY,
            Path = [],
            Velocity = new Vector2Float(0, 0),
            BodyAngularVelocity = 0,
            TurretAngularVelocity = 0,
            Guns = [BASE_GUN],
            SelectedGunIndex = 0
        };

        ctx.Db.tank.Id.Update(respawnedTank);
        Log.Info($"Tank {tank.Name} respawned at position ({spawnX}, {spawnY})");
    }

    [Reducer]
    public static void switchGun(ReducerContext ctx, int gunIndex)
    {
        Tank? maybeTank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.IsDead) return;

        if (gunIndex < 0 || gunIndex >= tank.Guns.Length) return;

        tank.SelectedGunIndex = gunIndex;
        ctx.Db.tank.Id.Update(tank);
        Log.Info($"Tank {tank.Name} switched to gun at index {gunIndex} ({tank.Guns[gunIndex].GunType})");
    }
}
