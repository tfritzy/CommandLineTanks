using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void respawn(ReducerContext ctx, string gameId)
    {
        MaybeResumeUpdatersForHomeworld(ctx, gameId);

        Tank? tankQuery = ctx.Db.tank.GameId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;
        
        var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
        if (transformQuery == null) return;
        var transform = transformQuery.Value;

        if (tank.Health > 0) return;

        DeleteTankPathIfExists(ctx, tank.Id);

        RespawnTank(ctx, tank, transform, gameId, tank.Alliance);
        Log.Info($"Tank {tank.Name} respawned");
    }
}
