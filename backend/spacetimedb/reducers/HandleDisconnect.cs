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

        var metadatas = ctx.Db.tank_metadata.Owner.Filter(ctx.Sender);
        foreach (var metadata in metadatas)
        {
            var tank = ctx.Db.tank.Id.Find(metadata.TankId);
            if (tank != null)
            {
                RemoveTankFromWorld(ctx, tank.Value, metadata);
                Log.Info($"Player {player.Value.Name} disconnected, removed tank {metadata.TankId} in world {metadata.WorldId}");
            }
        }

        var identityString = ctx.Sender.ToString().ToLower();
        DeleteHomeworldIfEmpty(ctx, identityString);
    }
}
