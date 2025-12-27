using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void joinWorld(ReducerContext ctx, string worldId)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var tank = CreateTankInWorld(ctx, worldId, ctx.Sender, "");
        if (tank != null)
        {
            ctx.Db.tank.Insert(tank.Value);
            Log.Info($"Player {player.Value.Name} joined world {worldId} with tank {tank.Value.Id} named {tank.Value.Name}");
        }
    }
}
