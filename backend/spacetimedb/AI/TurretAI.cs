using SpacetimeDB;
using static Types;
using System;
using System.Linq;
using static Module;

public static partial class TurretAI
{
    private const int TILE_SIZE = 6;
    private const float AIM_TOLERANCE = 0.05f;
    private const int TARGET_SWITCH_TICK_INTERVAL = 5;

    public static Tank EvaluateAndMutateTank(ReducerContext ctx, Tank tank, AIContext aiContext, int tickCount)
    {
        bool shouldSwitch = (tickCount % TARGET_SWITCH_TICK_INTERVAL) == 0;

        if (shouldSwitch || tank.Target == null)
        {
            tank = SelectNewTarget(ctx, tank, aiContext);
        }
        else if (tank.Target != null)
        {
            var targetTank = ctx.Db.tank.Id.Find(tank.Target);
            if (targetTank == null || targetTank.Value.Health <= 0 || !IsInSameTile(tank, targetTank.Value))
            {
                tank = SelectNewTarget(ctx, tank, aiContext);
            }
        }

        if (tank.Target != null)
        {
            float angleDiff = Math.Abs(GetNormalizedAngleDifference(tank.TargetTurretRotation, tank.TurretRotation));
            if (angleDiff < AIM_TOLERANCE)
            {
                tank = FireTankWeapon(ctx, tank);
            }
        }

        return tank;
    }

    private static Tank SelectNewTarget(ReducerContext ctx, Tank tank, AIContext aiContext)
    {
        var allTanks = aiContext.GetAllTanks();
        var tanksInTile = allTanks
            .Where(t => t.Id != tank.Id && t.Health > 0 && t.IsBot && IsInSameTile(tank, t))
            .ToList();

        Tank updatedTank = tank;

        if (tanksInTile.Count > 0)
        {
            var targetTank = tanksInTile[aiContext.GetRandom().Next(tanksInTile.Count)];
            updatedTank = TargetTankByName(ctx, tank, targetTank.Name, 0);
        }
        else
        {
            updatedTank = tank with { Target = null };
        }

        return updatedTank;
    }

    private static bool IsInSameTile(Tank tank1, Tank tank2)
    {
        int tank1TileX = (int)tank1.PositionX / TILE_SIZE;
        int tank1TileY = (int)tank1.PositionY / TILE_SIZE;
        int tank2TileX = (int)tank2.PositionX / TILE_SIZE;
        int tank2TileY = (int)tank2.PositionY / TILE_SIZE;

        return tank1TileX == tank2TileX && tank1TileY == tank2TileY;
    }
}
