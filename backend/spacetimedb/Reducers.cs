using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer(ReducerKind.Init)]
    public static void Init(ReducerContext ctx)
    {
        var worldId = GenerateId(ctx, "wld");
        var world = new World
        {
            Id = worldId,
            Name = "Default World",
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };

        ctx.Db.ScheduledTankUpdates.Insert(new TankUpdater.ScheduledTankUpdates
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
            Position = nextPos
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
    public static void aim(ReducerContext ctx, float angleRadians)
    {
        Tank tank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (tank.Id == null) return;

        tank.TargetTurretRotation = angleRadians;
        ctx.Db.tank.Id.Update(tank);
    }

    [Reducer]
    public static void findWorld(ReducerContext ctx)
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

        Tank existingTank = ctx.Db.tank.WorldId.Filter(world.Value.Id).FirstOrDefault();
        if (existingTank.Id != null)
        {
            return;
        }

        var tankId = GenerateId(ctx, "tnk");
        var tank = new Tank
        {
            Id = tankId,
            WorldId = world.Value.Id,
            Owner = ctx.Sender,
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
        Log.Info($"Player {player.Value.Name} joined world {world.Value.Name} with tank {tankId}");
    }
}
