using System;

public static partial class Module
{
    public static int GetGridPosition(float position)
    {
        return (int)position;
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
