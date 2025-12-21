using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void aim(ReducerContext ctx, string worldId, float angleRadians)
    {
        Tank tank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (tank.Id == null) return;

        if (tank.Health <= 0) return;

        var normalizedAngle = Module.NormalizeAngleToTarget(angleRadians, tank.TurretRotation);

        tank.TargetTurretRotation = normalizedAngle;
        tank.Target = null;
        ctx.Db.tank.Id.Update(tank);
    }
}
