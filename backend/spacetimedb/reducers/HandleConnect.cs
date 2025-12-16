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
            StartWorldTickers(ctx, identityString);

            var tankName = AllocateTankName(ctx, identityString);
            if (tankName != null)
            {
                var tank = BuildTank(ctx, identityString, ctx.Sender, tankName, "", 0, HOMEWORLD_SIZE / 2, HOMEWORLD_SIZE / 2);
                ctx.Db.tank.Insert(tank);
                Log.Info($"Created homeworld tank {tankName} for identity {identityString}");
            }
        }
    }
}
