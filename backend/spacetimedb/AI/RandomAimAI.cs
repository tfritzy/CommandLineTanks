using SpacetimeDB;
using static Types;
using System;
using static Module;

public static partial class RandomAimAI
{
    private const float AIM_TOLERANCE = 0.05f;

    public static Tank EvaluateAndMutateTank(ReducerContext ctx, Tank tank, AIContext aiContext)
    {
        float angleDiff = Math.Abs(GetNormalizedAngleDifference(tank.TargetTurretRotation, tank.TurretRotation));

        if (angleDiff < AIM_TOLERANCE)
        {
            tank = FireTankWeapon(ctx, tank);
            
            var (targetAngle, directionName) = GetRandomAngle(aiContext.GetRandom());
            string message;
            if (directionName != null)
            {
                message = $"aim {directionName}";
            }
            else
            {
                float targetAngleDegrees = (float)(-targetAngle * 180.0 / Math.PI);
                message = $"aim {targetAngleDegrees:F0}";
            }
            
            tank = tank with
            {
                TargetTurretRotation = NormalizeAngleToTarget(targetAngle, tank.TurretRotation),
                Target = null,
                Message = message
            };
        }

        return tank;
    }

    private static (float angle, string? directionName) GetRandomAngle(Random rng)
    {
        if (rng.Next(2) == 0)
        {
            var direction = (Direction)rng.Next(8);
            return (DirectionToAngle(direction), DirectionToName(direction));
        }
        else
        {
            return ((float)(rng.NextDouble() * Math.PI * 2), null);
        }
    }

    private static string DirectionToName(Direction direction)
    {
        return direction switch
        {
            Direction.North => "north",
            Direction.NorthEast => "northeast",
            Direction.East => "east",
            Direction.SouthEast => "southeast",
            Direction.South => "south",
            Direction.SouthWest => "southwest",
            Direction.West => "west",
            Direction.NorthWest => "northwest",
            _ => "north"
        };
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
