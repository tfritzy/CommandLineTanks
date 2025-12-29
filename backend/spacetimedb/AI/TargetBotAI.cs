using SpacetimeDB;
using static Types;
using System;
using static Module;

public static partial class TargetBotAI
{
    public static Tank EvaluateAndMutateTank(ReducerContext ctx, Tank tank, AIContext aiContext, int tickCount)
    {
        bool isEvenTick = tickCount % 2 == 0;
        
        if (isEvenTick)
        {
            var target = aiContext.GetClosestEnemyTank(tank);
            if (target != null)
            {
                tank = tank with
                {
                    Target = target.Value.Id,
                    Message = $"target {target.Value.Name}"
                };
            }
        }
        else
        {
            tank = FireTankWeapon(ctx, tank) with
            {
                Message = "fire"
            };
        }

        return tank;
    }
}
