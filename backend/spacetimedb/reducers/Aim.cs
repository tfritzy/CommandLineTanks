using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void aim(ReducerContext ctx, string worldId, float? angleRadians, string? targetCode)
    {
        Tank? tankQuery = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;

        if (tank.Health <= 0) return;

        if (targetCode != null)
        {
            tank = TargetTankByCode(ctx, tank, targetCode);
            ctx.Db.tank.Id.Update(tank);
        }
        else if (angleRadians != null)
        {
            var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
            if (transformQuery == null) return;
            var transform = transformQuery.Value;

            var normalizedAngle = Module.NormalizeAngleToTarget(angleRadians.Value, transform.TurretRotation);

            var updatedTransform = transform with 
            {
                TargetTurretRotation = normalizedAngle
            };
            ctx.Db.tank_transform.TankId.Update(updatedTransform);

            var updatedTank = tank with { Target = null };
            ctx.Db.tank.Id.Update(updatedTank);
        }
    }
}
