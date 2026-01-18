using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void respawn(ReducerContext ctx, string gameId)
    {
        MaybeResumeUpdatersForLowTrafficGame(ctx, gameId);

        Tank? tankQuery = ctx.Db.tank.GameId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;
        
        var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
        if (transformQuery == null) return;
        var transform = transformQuery.Value;

        if (tank.Health > 0) return;

        DeleteTankPathCommand.Call(ctx, tank.Id);

        RespawnTankCommand.Call(ctx, tank, transform, gameId, tank.Alliance);
        Log.Info($"Tank {tank.Name} respawned");
    }
}
