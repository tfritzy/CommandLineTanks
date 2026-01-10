using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void stop(ReducerContext ctx, string gameId)
    {
        Tank? tankQuery = ctx.Db.tank.WorldId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;
        
        var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
        if (transformQuery == null) return;
        var transform = transformQuery.Value;

        if (tank.Health <= 0) return;

        DeleteTankPathIfExists(ctx, tank.Id);

        var updatedTransform = transform with 
        {
            Velocity = new Vector2Float(0, 0),
            UpdatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };
        ctx.Db.tank_transform.TankId.Update(updatedTransform);
        Log.Info($"Tank {tank.Name} stopped");
    }
}
