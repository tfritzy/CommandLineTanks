using SpacetimeDB;
using static Types;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void drive(ReducerContext ctx, string worldId, int directionX, int directionY, float throttle)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        if (tank.IsRepairing)
        {
            tank = tank with { IsRepairing = false, Message = "Repair interrupted" };
            ctx.Db.tank.Id.Update(tank);
        }

        Vector2 offset = new Vector2 { X = directionX, Y = directionY };
        DriveToPosition(ctx, tank, offset, throttle, false);
    }
}
