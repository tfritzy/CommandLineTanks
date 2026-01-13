using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void ping(ReducerContext ctx, ulong clientTimestamp)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            return;
        }

        var updatedPlayer = player.Value;
        updatedPlayer.Ping = clientTimestamp;
        ctx.Db.player.Id.Update(updatedPlayer);
    }
}
