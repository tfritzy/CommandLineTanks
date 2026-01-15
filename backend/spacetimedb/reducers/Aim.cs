using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void aim(ReducerContext ctx, string gameId, float angleRadians)
    {
        MaybeResumeUpdatersForHomeworld(ctx, gameId);

        Tank? tankQuery = ctx.Db.tank.GameId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;

        if (tank.Health <= 0) return;

        var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
        if (transformQuery == null) return;
        var transform = transformQuery.Value;

        var normalizedAngle = Module.NormalizeAngleToTarget(angleRadians, transform.TurretRotation);

        var updatedTransform = transform with 
        {
            TargetTurretRotation = normalizedAngle
        };
        ctx.Db.tank_transform.TankId.Update(updatedTransform);

        var updatedTank = tank with { Target = null };
        ctx.Db.tank.Id.Update(updatedTank);
    }
}
