using System;
using System.Collections.Generic;
using System.Linq;
using static Types;

public static class BehaviorTreeLogic
{
    public enum AIAction
    {
        None,
        MoveTowardsPickup,
        AimAndFire,
        MoveTowardsEnemySpawn
    }

    public class AIDecision
    {
        public AIAction Action { get; set; }
        public Module.Tank? TargetTank { get; set; }
        public Module.Pickup? TargetPickup { get; set; }
        public int TargetX { get; set; }
        public int TargetY { get; set; }
        public float AimAngle { get; set; }
        public bool ShouldFire { get; set; }
    }

    public static AIDecision EvaluateBehaviorTree(Module.Tank tank, BehaviorTreeAI.AIContext context)
    {
        var nearbyPickup = FindNearestPickup(tank, context.GetAllPickups());
        if (nearbyPickup != null && ShouldCollectPickup(tank, nearbyPickup.Value))
        {
            return new AIDecision
            {
                Action = AIAction.MoveTowardsPickup,
                TargetPickup = nearbyPickup,
                TargetX = nearbyPickup.Value.PositionX,
                TargetY = nearbyPickup.Value.PositionY
            };
        }

        var target = FindNearestEnemy(tank, context.GetAllTanks());
        if (target != null)
        {
            var distanceToTarget = GetDistance(tank.PositionX, tank.PositionY, target.Value.PositionX, target.Value.PositionY);

            if (distanceToTarget < 10f && HasLineOfSight(tank, target.Value, context.GetTraversibilityMap()))
            {
                var deltaX = target.Value.PositionX - tank.PositionX;
                var deltaY = target.Value.PositionY - tank.PositionY;
                var aimAngle = Math.Atan2(deltaY, deltaX);

                var turretAngleDiff = aimAngle - tank.TurretRotation;
                while (turretAngleDiff > Math.PI) turretAngleDiff -= 2 * Math.PI;
                while (turretAngleDiff < -Math.PI) turretAngleDiff += 2 * Math.PI;

                return new AIDecision
                {
                    Action = AIAction.AimAndFire,
                    TargetTank = target,
                    AimAngle = (float)aimAngle,
                    ShouldFire = Math.Abs(turretAngleDiff) < 0.1f
                };
            }
        }

        var traversibilityMap = context.GetTraversibilityMap();
        if (traversibilityMap != null)
        {
            int enemySpawnX = tank.Alliance == 0
                ? (traversibilityMap.Value.Width * 3) / 4
                : traversibilityMap.Value.Width / 4;
            int enemySpawnY = traversibilityMap.Value.Height / 2;

            var (intermediateX, intermediateY) = FindPathTowards(tank, enemySpawnX, enemySpawnY, traversibilityMap);

            return new AIDecision
            {
                Action = AIAction.MoveTowardsEnemySpawn,
                TargetX = intermediateX,
                TargetY = intermediateY
            };
        }

        return new AIDecision { Action = AIAction.None };
    }

    public static bool ShouldCollectPickup(Module.Tank tank, Module.Pickup pickup)
    {
        if (tank.Guns.Length >= 3) return false;

        var distance = GetDistance(tank.PositionX, tank.PositionY, (float)pickup.PositionX, (float)pickup.PositionY);
        return distance < 15f;
    }

    public static Module.Tank? FindNearestEnemy(Module.Tank tank, List<Module.Tank> allTanks)
    {
        Module.Tank? nearest = null;
        float minDistance = float.MaxValue;

        foreach (var enemyTank in allTanks)
        {
            if (enemyTank.Alliance == tank.Alliance || enemyTank.IsDead)
                continue;

            var distance = GetDistance(tank.PositionX, tank.PositionY, enemyTank.PositionX, enemyTank.PositionY);
            if (distance < minDistance)
            {
                minDistance = distance;
                nearest = enemyTank;
            }
        }

        return nearest;
    }

    public static Module.Pickup? FindNearestPickup(Module.Tank tank, List<Module.Pickup> allPickups)
    {
        Module.Pickup? nearest = null;
        float minDistance = float.MaxValue;

        foreach (var pickup in allPickups.Where(p => p.WorldId == tank.WorldId))
        {
            var distance = GetDistance(tank.PositionX, tank.PositionY, (float)pickup.PositionX, (float)pickup.PositionY);
            if (distance < minDistance)
            {
                minDistance = distance;
                nearest = pickup;
            }
        }

        return nearest;
    }

    public static float GetDistance(float x1, float y1, float x2, float y2)
    {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return (float)Math.Sqrt(dx * dx + dy * dy);
    }

    public static bool HasLineOfSight(Module.Tank tank, Module.Tank target, Module.TraversibilityMap? traversibilityMap)
    {
        if (traversibilityMap == null) return false;

        var dx = target.PositionX - tank.PositionX;
        var dy = target.PositionY - tank.PositionY;
        var distance = Math.Sqrt(dx * dx + dy * dy);

        if (distance < 0.1f) return true;

        var steps = (int)Math.Ceiling(distance);
        var stepX = dx / steps;
        var stepY = dy / steps;

        for (int i = 1; i < steps; i++)
        {
            var checkX = GetGridPosition(tank.PositionX + stepX * i);
            var checkY = GetGridPosition(tank.PositionY + stepY * i);

            if (checkX < 0 || checkX >= traversibilityMap.Value.Width || checkY < 0 || checkY >= traversibilityMap.Value.Height)
                return false;

            var index = checkY * traversibilityMap.Value.Width + checkX;
            if (index >= 0 && index < traversibilityMap.Value.Map.Length)
            {
                if (!traversibilityMap.Value.Map[index])
                {
                    return false;
                }
            }
        }

        return true;
    }

    public static (int x, int y) FindPathTowards(Module.Tank tank, int targetX, int targetY, Module.TraversibilityMap? traversibilityMap)
    {
        if (traversibilityMap == null)
        {
            return (targetX, targetY);
        }

        int currentX = GetGridPosition(tank.PositionX);
        int currentY = GetGridPosition(tank.PositionY);

        int dx = Math.Sign(targetX - currentX);
        int dy = Math.Sign(targetY - currentY);

        int intermediateX = currentX + dx * 3;
        int intermediateY = currentY + dy * 3;

        intermediateX = Math.Clamp(intermediateX, 0, traversibilityMap.Value.Width - 1);
        intermediateY = Math.Clamp(intermediateY, 0, traversibilityMap.Value.Height - 1);

        int index = intermediateY * traversibilityMap.Value.Width + intermediateX;
        if (index >= 0 && index < traversibilityMap.Value.Map.Length && traversibilityMap.Value.Map[index])
        {
            return (intermediateX, intermediateY);
        }

        return (currentX + dx, currentY + dy);
    }

    private static int GetGridPosition(float position)
    {
        const float GRID_POSITION_TOLERANCE = 0.0001f;
        return (int)Math.Floor(position + GRID_POSITION_TOLERANCE);
    }
}
