using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void respawn(ReducerContext ctx, string worldId)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health > 0) return;

        DeleteTankPathIfExists(ctx, tank.Id);

        var respawnedTank = RespawnTank(ctx, tank, worldId, tank.Alliance);
        ctx.Db.tank.Id.Update(respawnedTank);
        Log.Info($"Tank {tank.Name} respawned at position ({respawnedTank.PositionX}, {respawnedTank.PositionY})");
    }
}
