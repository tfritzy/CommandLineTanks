using System;

public static partial class Module
{
    private const float GRID_POSITION_TOLERANCE = 0.0001f;

    public static int GetGridPosition(float position)
    {
        return (int)Math.Floor(position + GRID_POSITION_TOLERANCE);
    }

    private static float NormalizeAngleDiff(float angleDiff)
    {
        while (angleDiff > MathF.PI) angleDiff -= 2 * MathF.PI;
        while (angleDiff < -MathF.PI) angleDiff += 2 * MathF.PI;
        return angleDiff;
    }

    public static float NormalizeAngleToTarget(float targetAngle, float currentAngle)
    {
        var angleDiff = NormalizeAngleDiff(targetAngle - currentAngle);
        return currentAngle + angleDiff;
    }

    public static float GetNormalizedAngleDifference(float targetAngle, float currentAngle)
    {
        return NormalizeAngleDiff(targetAngle - currentAngle);
    }
}
