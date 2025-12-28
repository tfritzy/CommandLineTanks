using SpacetimeDB;
using static Types;
using System;
using static Module;

public static partial class RandomAimAI
{
    private const float AIM_TOLERANCE = 0.05f;

    public static Tank EvaluateAndMutateTank(ReducerContext ctx, Tank tank, AIContext aiContext)
    {
        var aimState = ctx.Db.random_aim_state.TankId.Find(tank.Id);
        
        if (aimState == null)
        {
            InitializeAimState(ctx, tank, aiContext.GetRandom());
            aimState = ctx.Db.random_aim_state.TankId.Find(tank.Id);
        }

        if (aimState == null)
        {
            return tank;
        }

        var state = aimState.Value;
        float angleDiff = Math.Abs(GetNormalizedAngleDifference(state.TargetAngle, tank.TurretRotation));

        if (angleDiff < AIM_TOLERANCE)
        {
            tank = FireTankWeapon(ctx, tank);
            
            InitializeAimState(ctx, tank, aiContext.GetRandom());
        }
        else
        {
            tank = tank with
            {
                TargetTurretRotation = NormalizeAngleToTarget(state.TargetAngle, tank.TurretRotation),
                Target = null
            };
        }

        return tank;
    }

    private static void InitializeAimState(ReducerContext ctx, Tank tank, Random rng)
    {
        float targetAngle;
        
        if (rng.Next(2) == 0)
        {
            targetAngle = DirectionToAngle((Direction)rng.Next(8));
        }
        else
        {
            targetAngle = (float)(rng.NextDouble() * Math.PI * 2);
        }

        var newState = new RandomAimState
        {
            TankId = tank.Id,
            WorldId = tank.WorldId,
            TargetAngle = targetAngle
        };

        var existingState = ctx.Db.random_aim_state.TankId.Find(tank.Id);
        if (existingState != null)
        {
            ctx.Db.random_aim_state.TankId.Update(newState);
        }
        else
        {
            ctx.Db.random_aim_state.Insert(newState);
        }
    }

    private static float DirectionToAngle(Direction direction)
    {
        return direction switch
        {
            Direction.East => 0f,
            Direction.NorthEast => (float)(Math.PI * 7 / 4),
            Direction.North => (float)(Math.PI * 3 / 2),
            Direction.NorthWest => (float)(Math.PI * 5 / 4),
            Direction.West => (float)Math.PI,
            Direction.SouthWest => (float)(Math.PI * 3 / 4),
            Direction.South => (float)(Math.PI / 2),
            Direction.SouthEast => (float)(Math.PI / 4),
            _ => 0f
        };
    }
}
