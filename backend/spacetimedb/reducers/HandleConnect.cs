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
        var existingTank = ctx.Db.tank.WorldId_Owner.Filter((identityString, ctx.Sender))
            .FirstOrDefault();
        if (existingTank.Id == null)
        {
            ReturnToHomeworld(ctx, "");
        }
    }
}
