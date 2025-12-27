using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void targetTank(ReducerContext ctx, string worldId, string targetName, float lead)
    {
        Tank tank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (tank.Id == null) return;

        tank = TargetTankByName(ctx, tank, targetName, lead);
        ctx.Db.tank.Id.Update(tank);
    }

    public static Tank TargetTankByName(ReducerContext ctx, Tank tank, string targetName, float lead)
    {
        if (tank.Health <= 0) return tank;

        var targetNameLower = targetName.ToLower();
        var targetTank = ctx.Db.tank.WorldId_Name.Filter((tank.WorldId, targetNameLower)).FirstOrDefault();

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
