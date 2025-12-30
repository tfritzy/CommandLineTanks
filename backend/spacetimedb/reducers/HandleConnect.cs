using SpacetimeDB;

public static partial class Module
{
    [Reducer(ReducerKind.ClientConnected)]
    public static void HandleConnect(ReducerContext ctx)
    {
        var existingPlayer = ctx.Db.player.Identity.Find(ctx.Sender);

        if (existingPlayer == null)
        {
            var playerId = GenerateId(ctx, "plr");
            var randomSuffix = ctx.Rng.Next(1000, 9999);
            var newHomeworldId = GenerateWorldId(ctx);
            var player = new Player
            {
                Id = playerId,
                Identity = ctx.Sender,
                Name = $"Guest{randomSuffix}",
                CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
                HomeworldId = newHomeworldId
            };

            ctx.Db.player.Insert(player);
            CreateHomeworld(ctx, newHomeworldId);
            Log.Info($"New player connected with ID {playerId} and homeworld {newHomeworldId}");
            existingPlayer = player;
        }
        else
        {
            Log.Info($"Player {existingPlayer.Value.Name} reconnected");
        }

        var homeworldId = existingPlayer.Value.HomeworldId;
        if (homeworldId == null)
        {
            Log.Info("Player has no homeworld ID, creating one for migration");
            homeworldId = GenerateWorldId(ctx);
            var updatedPlayer = existingPlayer.Value;
            updatedPlayer.HomeworldId = homeworldId;
            ctx.Db.player.Id.Update(updatedPlayer);
            CreateHomeworld(ctx, homeworldId);
        }

        var existingTank = ctx.Db.tank.WorldId.Filter(homeworldId)
            .Where(t => t.Owner == ctx.Sender)
            .FirstOrDefault();
        if (existingTank.Id == null)
        {
            var targetCode = AllocateTargetCode(ctx, homeworldId);
            if (targetCode != null)
            {
                var playerName = existingPlayer.Value.Name;
                var tank = BuildTank(
                    ctx,
                    homeworldId,
                    ctx.Sender,
                    playerName,
                    targetCode,
                    "",
                    0,
                    HOMEWORLD_WIDTH / 2 + .5f,
                    HOMEWORLD_HEIGHT / 2 + .5f);
                ctx.Db.tank.Insert(tank);

                StartWorldTickers(ctx, homeworldId);

                Log.Info($"Created homeworld tank {targetCode} for player in world {homeworldId}");
            }
        }
    }
}
