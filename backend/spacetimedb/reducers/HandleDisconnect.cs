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

        Tank tank = ctx.Db.tank.Owner.Filter(ctx.Sender).FirstOrDefault();
        if (!string.IsNullOrEmpty(tank.Id))
        {
            var fireState = ctx.Db.tank_fire_state.TankId.Find(tank.Id);
            if (fireState != null)
            {
                ctx.Db.tank_fire_state.TankId.Delete(tank.Id);
            }

            DeleteTankPathIfExists(ctx, tank.Id);

            var isBot = tank.IsBot;
            var worldId = tank.WorldId;
            ctx.Db.tank.Id.Delete(tank.Id);
            
            if (isBot)
            {
                DecrementBotCount(ctx, worldId);
            }
            else
            {
                DecrementPlayerCount(ctx, worldId);
            }
            
            Log.Info($"Player {player.Value.Name} disconnected, removed tank {tank.Id} named {tank.Name ?? "Unknown"}");
        }
    }
}
