using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void stop(ReducerContext ctx, string worldId)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        tank.Path = [];
        tank.Velocity = new Vector2Float(0, 0);
        tank.BodyAngularVelocity = 0;
        ctx.Db.tank.Id.Update(tank);
        Log.Info($"Tank {tank.Name} stopped");
    }
}
