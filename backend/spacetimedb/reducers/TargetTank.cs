using SpacetimeDB;

public static partial class Module
{
    [Reducer]
    public static void targetTank(ReducerContext ctx, string worldId, string targetName, float lead)
    {
        Tank tank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (tank.Id == null) return;

        if (tank.IsDead) return;

        var targetNameLower = targetName.ToLower();
        var targetTank = ctx.Db.tank.WorldId_Name.Filter((worldId, targetNameLower)).FirstOrDefault();

        if (targetTank.Id == null)
        {
            return;
        }

        tank.Target = targetTank.Id;
        tank.TargetLead = lead;
        ctx.Db.tank.Id.Update(tank);
    }
}
