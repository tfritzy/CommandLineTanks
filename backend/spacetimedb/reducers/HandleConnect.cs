using SpacetimeDB;

public static partial class Module
{
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
            var randomSuffix = ctx.Rng.Next(1000, 9999);
            var player = new Player
            {
                Id = playerId,
                Identity = ctx.Sender,
                Name = $"Guest{randomSuffix}",
                CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
            };

            ctx.Db.player.Insert(player);
            Log.Info($"New player connected with ID {playerId}");
        }

        var identityString = ctx.Sender.ToString().ToLower();
        var existingHomeworld = ctx.Db.world.Id.Find(identityString);
        if (existingHomeworld == null)
        {
            CreateHomeworld(ctx, identityString);
        }

        var existingTank = ctx.Db.tank.WorldId.Filter(identityString)
            .Where(t => t.Owner == ctx.Sender)
            .FirstOrDefault();
        if (existingTank.Id == null)
        {
            var tank = CreateHomeworldTank(ctx, ctx.Sender);
            if (tank != null)
            {
                ctx.Db.tank.Insert(tank.Value);
                Log.Info($"Created homeworld tank {tank.Value.TargetCode} for identity {identityString}");
            }
        }
    }
}
