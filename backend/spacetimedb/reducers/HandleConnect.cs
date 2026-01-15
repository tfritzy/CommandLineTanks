using SpacetimeDB;

public static partial class Module
{
    [Reducer(ReducerKind.ClientConnected)]
    public static void HandleConnect(ReducerContext ctx)
    {
        var existingPlayer = ctx.Db.player.Identity.Find(ctx.Sender);
        var isNewPlayer = existingPlayer == null;

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
                Name = null,
                CreatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
                Ping = 0
            };

            ctx.Db.player.Insert(player);
            Log.Info($"New player connected with ID {playerId}");
        }

        bool hasAnyTank = false;
        foreach (var tank in ctx.Db.tank.Owner.Filter(ctx.Sender))
        {
            if (!tank.IsBot)
            {
                hasAnyTank = true;
                break;
            }
        }

        if (!hasAnyTank)
        {
            if (isNewPlayer)
            {
                var joinCode = $"tutorial_start_{ctx.Timestamp.MicrosecondsSinceUnixEpoch}";
                CreateTutorialGame(ctx, ctx.Sender, joinCode);
                Log.Info($"New player routed to tutorial");
            }
            else
            {
                ReturnToHomegame(ctx, "");
            }
        }
    }
}
