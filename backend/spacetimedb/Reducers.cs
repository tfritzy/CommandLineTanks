using SpacetimeDB;
using static Types;

public static partial class Module
{
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

        tank.TargetTurretRotation = angleRadians;
        tank.Target = null;
        ctx.Db.tank.Id.Update(tank);
    }

    [Reducer]
    public static void targetTank(ReducerContext ctx, string targetName, float lead)
    {
        Tank tank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (tank.Id == null) return;

        var targetTank = ctx.Db.tank.WorldId_Name.Filter((tank.WorldId, targetName)).FirstOrDefault();

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

        var tankId = GenerateId(ctx, "tnk");
        var alliance = string.IsNullOrEmpty(joinCode) || joinCode.ToUpper().StartsWith("R") ? Alliance.Red : Alliance.Blue;
        var tank = new Tank
        {
            Id = tankId,
            WorldId = world.Value.Id,
            Owner = ctx.Sender,
            Name = tankName,
            JoinCode = joinCode,
            Alliance = alliance,
            Health = Module.TANK_HEALTH,
            CollisionRegionX = 0,
            CollisionRegionY = 0,
            Target = null,
            TargetLead = 0.0f,
            Path = [],
            PositionX = 0.0f,
            PositionY = 0.0f,
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
}
