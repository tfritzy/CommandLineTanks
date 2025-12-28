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

        var pathState = ctx.Db.tank_path.TankId.Find(tank.Id);
        if (pathState != null)
        {
            ctx.Db.tank_path.TankId.Delete(tank.Id);
        }

        tank.Velocity = new Vector2Float(0, 0);
        ctx.Db.tank.Id.Update(tank);
        Log.Info($"Tank {tank.Name} stopped");
    }
}
