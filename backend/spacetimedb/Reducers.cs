using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const float SPAWN_PADDING_RATIO = 0.25f;
    private const int MAX_SPAWN_ATTEMPTS = 100;

    private static (float, float) FindSpawnPosition(World world, int alliance, Random random)
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
            if (index < world.TraversibilityMap.Length && world.TraversibilityMap[index])
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

        var (baseTerrain, terrainDetail) = TerrainGenerator.GenerateTerrain(ctx.Rng);
        var traversibilityMap = TerrainGenerator.CalculateTraversibility(baseTerrain, terrainDetail);

        var world = new World
        {
            Id = worldId,
            Name = "Default World",
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Width = TerrainGenerator.GetWorldWidth(),
            Height = TerrainGenerator.GetWorldHeight(),
            BaseTerrainLayer = baseTerrain,
            TerrainDetailLayer = terrainDetail,
            TraversibilityMap = traversibilityMap
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

        Tank? targetTank = null;
        foreach (var t in ctx.Db.tank.WorldId.Filter(tank.WorldId))
        {
            if (t.Name != null && t.Name.Equals(targetName, StringComparison.OrdinalIgnoreCase))
            {
                targetTank = t;
                break;
            }
        }

        if (targetTank == null || targetTank.Value.Id == null)
        {
            return;
        }

        tank.Target = targetTank.Value.Id;
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

        float barrelTipX = tank.PositionX + (float)Math.Cos(tank.TurretRotation) * GUN_BARREL_LENGTH;
        float barrelTipY = tank.PositionY + (float)Math.Sin(tank.TurretRotation) * GUN_BARREL_LENGTH;

        float velocityX = (float)Math.Cos(tank.TurretRotation) * PROJECTILE_SPEED;
        float velocityY = (float)Math.Sin(tank.TurretRotation) * PROJECTILE_SPEED;

        var projectileId = GenerateId(ctx, "prj");
        var projectile = new Projectile
        {
            Id = projectileId,
            WorldId = tank.WorldId,
            ShooterTankId = tank.Id,
            Alliance = tank.Alliance,
            PositionX = barrelTipX,
            PositionY = barrelTipY,
            Speed = PROJECTILE_SPEED,
            Size = PROJECTILE_SIZE,
            Velocity = new Vector2Float(velocityX, velocityY)
        };

        ctx.Db.projectile.Insert(projectile);
        Log.Info($"Tank {tank.Name} fired projectile {projectileId} from position ({barrelTipX}, {barrelTipY}) with velocity ({velocityX}, {velocityY})");
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

        var (spawnX, spawnY) = FindSpawnPosition(world.Value, assignedAlliance, ctx.Rng);

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
            TurretRotationSpeed = 3f
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

        var (spawnX, spawnY) = FindSpawnPosition(world, tank.Alliance, ctx.Rng);

        var respawnedTank = tank with
        {
            Health = Module.TANK_HEALTH,
            IsDead = false,
            PositionX = spawnX,
            PositionY = spawnY,
            Path = [],
            Velocity = new Vector2Float(0, 0),
            BodyAngularVelocity = 0,
            TurretAngularVelocity = 0
        };

        ctx.Db.tank.Id.Update(respawnedTank);
        Log.Info($"Tank {tank.Name} respawned at position ({spawnX}, {spawnY})");
    }
}
