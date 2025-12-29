using SpacetimeDB;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void driveToTank(ReducerContext ctx, string worldId, string targetCode, float throttle)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        Tank? maybeTargetTank = ctx.Db.tank.WorldId_TargetCode.Filter((worldId, targetCode.ToLower())).FirstOrDefault();
        if (maybeTargetTank == null) return;
        var targetTank = maybeTargetTank.Value;

        if (targetTank.Id == tank.Id) return;

        int targetX = (int)targetTank.PositionX;
        int targetY = (int)targetTank.PositionY;

        driveTo(ctx, worldId, targetX, targetY, throttle);
    }
}
