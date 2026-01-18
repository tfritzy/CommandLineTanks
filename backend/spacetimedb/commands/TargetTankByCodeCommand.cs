using SpacetimeDB;
using static Types;
using System.Linq;

public static partial class Module
{
    public static Tank TargetTankByCode(ReducerContext ctx, Tank tank, string targetCode)
    {
        if (tank.Health <= 0) return tank;

        var targetCodeLower = targetCode.ToLower();
        var targetTank = ctx.Db.tank.GameId_TargetCode.Filter((tank.GameId, targetCodeLower)).FirstOrDefault();

        if (targetTank.Id == null)
        {
            return tank;
        }

        return tank with
        {
            Target = targetTank.Id,
            TargetLead = 0
        };
    }
}
