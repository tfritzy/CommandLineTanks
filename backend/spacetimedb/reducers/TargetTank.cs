using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void targetTank(ReducerContext ctx, string worldId, string targetCode, float lead)
    {
        Tank tank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (tank.Id == null) return;

        tank = TargetTankByCode(ctx, tank, targetCode, lead);
        ctx.Db.tank.Id.Update(tank);
    }

    public static Tank TargetTankByCode(ReducerContext ctx, Tank tank, string targetCode, float lead)
    {
        if (tank.Health <= 0) return tank;

        var targetCodeLower = targetCode.ToLower();
        var targetTank = ctx.Db.tank.WorldId_TargetCode.Filter((tank.WorldId, targetCodeLower)).FirstOrDefault();

        if (targetTank.Id == null)
        {
            return tank;
        }

        return tank with
        {
            Target = targetTank.Id,
            TargetLead = lead
        };
    }
}
