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
        public bool ShouldFire { get; set; }
    }

    public static AIDecision EvaluateBehaviorTree(Module.Tank tank, BehaviorTreeAI.AIContext context)
    {
        var allTanks = context.GetAllTanks();
        
        var nearbyTank = FindNearestTank(tank, allTanks);
        if (nearbyTank != null)
        {
            var distanceToNearby = GetDistance(tank.PositionX, tank.PositionY, nearbyTank.Value.PositionX, nearbyTank.Value.PositionY);
            
            if (distanceToNearby < 0.5f)
            {
                var tMap = context.GetTraversibilityMap();
                if (tMap != null)
                {
                    var (escapeX, escapeY) = FindRandomEscapePosition(tank, tMap.Value);
                    if (escapeX != GetGridPosition(tank.PositionX) || escapeY != GetGridPosition(tank.PositionY))
                    {
                        return new AIDecision
                        {
                            Action = AIAction.MoveTowardsEnemySpawn,
                            TargetX = escapeX,
                            TargetY = escapeY
                        };
                    }
                }
            }
        }

        var target = FindNearestEnemy(tank, allTanks);
        if (target != null)
        {
            var distanceToTarget = GetDistance(tank.PositionX, tank.PositionY, target.Value.PositionX, target.Value.PositionY);

            if (distanceToTarget < 15f && HasLineOfSight(tank, target.Value, context.GetTraversibilityMap()))
            {
                return new AIDecision
                {
                    Action = AIAction.AimAndFire,
                    TargetTank = target,
                    ShouldFire = true
                };
            }
        }

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
        var distance = GetDistance(tank.PositionX, tank.PositionY, (float)pickup.PositionX, (float)pickup.PositionY);
        if (distance >= 15f) return false;

        if (pickup.Type == TerrainDetailType.HealthPickup)
        {
            return tank.Health < tank.MaxHealth;
        }

        if (tank.Guns.Length >= 3) return false;

        return true;
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

    public static Module.Tank? FindNearestTank(Module.Tank tank, List<Module.Tank> allTanks)
    {
        Module.Tank? nearest = null;
        float minDistance = float.MaxValue;

        foreach (var otherTank in allTanks)
        {
            if (otherTank.Id == tank.Id || otherTank.IsDead)
                continue;

            var distance = GetDistance(tank.PositionX, tank.PositionY, otherTank.PositionX, otherTank.PositionY);
            if (distance < minDistance)
            {
                minDistance = distance;
                nearest = otherTank;
            }
        }

        return nearest;
    }

    public static double GetAngleDifference(Module.Tank tank, Module.Tank target)
    {
        var deltaX = target.PositionX - tank.PositionX;
        var deltaY = target.PositionY - tank.PositionY;
        var aimAngle = Math.Atan2(deltaY, deltaX);

        var turretAngleDiff = aimAngle - tank.TurretRotation;
        while (turretAngleDiff > Math.PI) turretAngleDiff -= 2 * Math.PI;
        while (turretAngleDiff < -Math.PI) turretAngleDiff += 2 * Math.PI;

        return turretAngleDiff;
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

        if (dx == 0 && dy == 0)
        {
            return (currentX, currentY);
        }

        (int, int)[] candidateMoves = new[]
        {
            (dx * 3, dy * 3),
            (dx * 2, dy * 2),
            (dx * 3, dy * 2),
            (dx * 2, dy * 3),
            (dx * 1, dy * 1),
            (dx * 2, dy * 1),
            (dx * 1, dy * 2),
            (dx * 3, 0),
            (0, dy * 3),
            (dx * 2, 0),
            (0, dy * 2),
            (dx * 1, 0),
            (0, dy * 1),
        };

        foreach (var (moveX, moveY) in candidateMoves)
        {
            if (moveX == 0 && moveY == 0) continue;

            int checkX = currentX + moveX;
            int checkY = currentY + moveY;
            
            checkX = Math.Clamp(checkX, 0, traversibilityMap.Value.Width - 1);
            checkY = Math.Clamp(checkY, 0, traversibilityMap.Value.Height - 1);

            if (checkX == currentX && checkY == currentY) continue;

            int index = checkY * traversibilityMap.Value.Width + checkX;
            if (index >= 0 && index < traversibilityMap.Value.Map.Length && traversibilityMap.Value.Map[index])
            {
                return (checkX, checkY);
            }
        }

        return (currentX, currentY);
    }

    public static (int x, int y) FindRandomEscapePosition(Module.Tank tank, Module.TraversibilityMap traversibilityMap)
    {
        int currentX = GetGridPosition(tank.PositionX);
        int currentY = GetGridPosition(tank.PositionY);

        (int, int)[] escapeMoves = new[]
        {
            (2, 0), (0, 2), (-2, 0), (0, -2),
            (1, 1), (1, -1), (-1, 1), (-1, -1),
            (2, 1), (2, -1), (-2, 1), (-2, -1),
            (1, 2), (1, -2), (-1, 2), (-1, -2),
        };

        var validMoves = new List<(int x, int y)>();

        foreach (var (moveX, moveY) in escapeMoves)
        {
            int checkX = currentX + moveX;
            int checkY = currentY + moveY;
            
            if (checkX < 0 || checkX >= traversibilityMap.Width || checkY < 0 || checkY >= traversibilityMap.Height)
                continue;

            int index = checkY * traversibilityMap.Width + checkX;
            if (index >= 0 && index < traversibilityMap.Map.Length && traversibilityMap.Map[index])
            {
                validMoves.Add((checkX, checkY));
            }
        }

        if (validMoves.Count > 0)
        {
            var random = new Random();
            return validMoves[random.Next(validMoves.Count)];
        }

        return (currentX, currentY);
    }

    public static (int x, int y) FindEscapePosition(Module.Tank tank, Module.Tank enemy, Module.TraversibilityMap traversibilityMap)
    {
        int currentX = GetGridPosition(tank.PositionX);
        int currentY = GetGridPosition(tank.PositionY);

        int awayDx = Math.Sign(tank.PositionX - enemy.PositionX);
        int awayDy = Math.Sign(tank.PositionY - enemy.PositionY);

        if (awayDx == 0 && awayDy == 0)
        {
            awayDx = 1;
            awayDy = 0;
        }

        (int, int)[] escapeMoves = new[]
        {
            (awayDx * 2, awayDy * 2),
            (awayDx * 1, awayDy * 1),
            (awayDx * 2, 0),
            (0, awayDy * 2),
            (awayDx * 1, 0),
            (0, awayDy * 1),
            (awayDx * -1, awayDy * 1),
            (awayDx * 1, awayDy * -1),
        };

        foreach (var (moveX, moveY) in escapeMoves)
        {
            if (moveX == 0 && moveY == 0) continue;

            int checkX = currentX + moveX;
            int checkY = currentY + moveY;
            
            checkX = Math.Clamp(checkX, 0, traversibilityMap.Width - 1);
            checkY = Math.Clamp(checkY, 0, traversibilityMap.Height - 1);

            if (checkX == currentX && checkY == currentY) continue;

            int index = checkY * traversibilityMap.Width + checkX;
            if (index >= 0 && index < traversibilityMap.Map.Length && traversibilityMap.Map[index])
            {
                return (checkX, checkY);
            }
        }

        return (currentX, currentY);
    }

    private static int GetGridPosition(float position)
    {
        const float GRID_POSITION_TOLERANCE = 0.0001f;
        return (int)Math.Floor(position + GRID_POSITION_TOLERANCE);
    }
}
