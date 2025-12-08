using SpacetimeDB;

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

        ctx.Db.World.Insert(world);
        Log.Info($"Initialized world {worldId}");
    }

    [Reducer(ReducerKind.ClientConnected)]
    public static void HandleConnect(ReducerContext ctx)
    {
        var existingPlayer = ctx.Db.Player.Identity.Find(ctx.Sender);

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

            ctx.Db.Player.Insert(player);
            Log.Info($"New player connected with ID {playerId}");
        }
    }

    [Reducer]
    public static void createWorld(ReducerContext ctx, string name)
    {
        var worldId = GenerateId(ctx, "wld");
        var world = new World
        {
            Id = worldId,
            Name = name,
            CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };

        ctx.Db.World.Insert(world);
        Log.Info($"Created world {name} with ID {worldId}");
    }

    [Reducer]
    public static void findWorld(ReducerContext ctx)
    {
        var player = ctx.Db.Player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var existingTank = ctx.Db.Tank.Player.Find(ctx.Sender);
        if (existingTank != null)
        {
            Log.Info($"Player {player.Value.Name} already has a tank in world {existingTank.Value.WorldId}");
            return;
        }

        World? world = null;
        foreach (var w in ctx.Db.World.Iter())
        {
            world = w;
            break;
        }

        if (world == null)
        {
            Log.Error("No worlds available");
            return;
        }

        var tankId = GenerateId(ctx, "tnk");
        var tank = new Tank
        {
            Id = tankId,
            WorldId = world.Value.Id,
            Player = ctx.Sender,
            PositionX = 0.0f,
            PositionY = 0.0f,
            BodyRotation = 0.0f,
            TurretRotation = 0.0f
        };

        ctx.Db.Tank.Insert(tank);
        Log.Info($"Player {player.Value.Name} joined world {world.Value.Name} with tank {tankId}");
    }
}
