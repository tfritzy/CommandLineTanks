using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void aim(ReducerContext ctx, string worldId, float angleRadians)
    {
        TankMetadata? metadataQuery = ctx.Db.tank_metadata.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (metadataQuery == null || metadataQuery.Value.TankId == null) return;
        var metadata = metadataQuery.Value;
        
        var tankQuery = ctx.Db.tank.Id.Find(metadata.TankId);
        if (tankQuery == null) return;
        var tank = tankQuery.Value;

        if (tank.Health <= 0) return;

        var normalizedAngle = Module.NormalizeAngleToTarget(angleRadians, tank.TurretRotation);

        var updatedTank = tank with 
        {
            TargetTurretRotation = normalizedAngle,
            Target = null
        };
        ctx.Db.tank.Id.Update(updatedTank);
    }
}
