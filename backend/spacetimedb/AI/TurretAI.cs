using SpacetimeDB;
using static Types;
using System;
using System.Linq;
using static Module;

public static partial class TurretAI
{
    private const int TILE_SIZE = 6;
    private const float AIM_TOLERANCE = 0.05f;
    private const ulong TARGET_SWITCH_INTERVAL_MICROS = 5_000_000;

    public static Tank EvaluateAndMutateTank(ReducerContext ctx, Tank tank, AIContext aiContext)
    {
        var turretState = ctx.Db.turret_ai_state.TankId.Find(tank.Id);
        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;

        if (turretState == null || ShouldSwitchTarget(turretState.Value, currentTime))
        {
            tank = SelectNewTarget(ctx, tank, aiContext, currentTime);
        }
        else if (tank.Target != null)
        {
            var targetTank = ctx.Db.tank.Id.Find(tank.Target);
            if (targetTank == null || targetTank.Value.Health <= 0 || !IsInSameTile(tank, targetTank.Value))
            {
                tank = SelectNewTarget(ctx, tank, aiContext, currentTime);
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

    private static bool ShouldSwitchTarget(TurretAIState state, ulong currentTime)
    {
        if (state.LastTargetSwitchTime == 0)
        {
            return true;
        }
        ulong timeSinceLastSwitch = currentTime - state.LastTargetSwitchTime;
        return timeSinceLastSwitch >= TARGET_SWITCH_INTERVAL_MICROS;
    }

    private static Tank SelectNewTarget(ReducerContext ctx, Tank tank, AIContext aiContext, ulong currentTime)
    {
        var allTanks = aiContext.GetAllTanks();
        var tanksInTile = allTanks
            .Where(t => t.Id != tank.Id && t.Health > 0 && IsInSameTile(tank, t))
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

        var state = new TurretAIState
        {
            TankId = tank.Id,
            WorldId = tank.WorldId,
            LastTargetSwitchTime = currentTime
        };

        var existingState = ctx.Db.turret_ai_state.TankId.Find(tank.Id);
        if (existingState != null)
        {
            ctx.Db.turret_ai_state.TankId.Update(state);
        }
        else
        {
            ctx.Db.turret_ai_state.Insert(state);
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
