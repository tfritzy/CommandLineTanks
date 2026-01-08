using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void targetTank(ReducerContext ctx, string worldId, string targetCode, float lead)
    {
        TankMetadata? metadataQuery = ctx.Db.tank_metadata.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (metadataQuery == null || metadataQuery.Value.TankId == null) return;
        var metadata = metadataQuery.Value;
        
        var tankQuery = ctx.Db.tank.Id.Find(metadata.TankId);
        if (tankQuery == null) return;
        var tank = tankQuery.Value;

        tank = TargetTankByCode(ctx, tank, targetCode, lead);
        ctx.Db.tank.Id.Update(tank);
    }

    public static Tank TargetTankByCode(ReducerContext ctx, Tank tank, string targetCode, float lead)
    {
        if (tank.Health <= 0) return tank;

        var targetCodeLower = targetCode.ToLower();
        var targetMetadata = ctx.Db.tank_metadata.WorldId_TargetCode.Filter((tank.WorldId, targetCodeLower)).FirstOrDefault();

        if (targetMetadata.TankId == null)
        {
            return tank;
        }

        return tank with
        {
            Target = targetMetadata.TankId,
            TargetLead = lead
        };
    }
}
