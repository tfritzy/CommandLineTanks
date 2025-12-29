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
            var targetCode = AllocateTargetCode(ctx, identityString);
            if (targetCode != null)
            {
                var player = ctx.Db.player.Identity.Find(ctx.Sender);
                var playerName = player?.Name ?? $"Guest{ctx.Rng.Next(1000, 9999)}";
                var tank = BuildTank(
                    ctx,
                    identityString,
                    ctx.Sender,
                    playerName,
                    targetCode,
                    "",
                    0,
                    HOMEWORLD_SIZE / 2 + .5f,
                    HOMEWORLD_SIZE / 2 + .5f);
                ctx.Db.tank.Insert(tank);

                StartWorldTickers(ctx, identityString);

                Log.Info($"Created homeworld tank {targetCode} for identity {identityString}");
            }
        }
    }
}
