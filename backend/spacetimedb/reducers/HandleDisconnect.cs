using SpacetimeDB;

public static partial class Module
{
    [Reducer(ReducerKind.ClientDisconnected)]
    public static void HandleDisconnect(ReducerContext ctx)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            return;
        }

        var tanks = ctx.Db.tank.Owner.Filter(ctx.Sender);
        foreach (var tank in tanks)
        {
            RemoveTankFromWorld(ctx, tank);
            Log.Info($"Player {player.Value.Name} disconnected, removed tank {tank.Id} in world {tank.WorldId}");
        }

        var identityString = ctx.Sender.ToString().ToLower();
        DeleteHomeworld(ctx, identityString);
    }
}
