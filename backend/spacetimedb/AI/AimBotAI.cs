using SpacetimeDB;
using static Types;
using System;
using static Module;

public static partial class AimBotAI
{
    public static Tank EvaluateAndMutateTank(ReducerContext ctx, Tank tank, AIContext aiContext, int tickCount)
    {
        bool isEvenTick = tickCount % 2 == 0;
        
        if (isEvenTick)
        {
            var target = aiContext.GetClosestEnemyTank(tank);
            if (target != null)
            {
                float targetAngle = GetAngleToTarget(tank.PositionX, tank.PositionY, target.Value.PositionX, target.Value.PositionY);
                tank = tank with
                {
                    TargetTurretRotation = NormalizeAngleToTarget(targetAngle, tank.TurretRotation),
                    Message = $"aim {target.Value.Name}"
                };
            }
        }
        else
        {
            tank = FireTankWeapon(ctx, tank);
            tank = tank with
            {
                Message = "fire"
            };
        }

        return tank;
    }

    private static float GetAngleToTarget(float fromX, float fromY, float toX, float toY)
    {
        float dx = toX - fromX;
        float dy = toY - fromY;
        return (float)Math.Atan2(dy, dx);
    }
}
