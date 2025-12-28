using System;
using System.Collections.Generic;
using System.Linq;
using SpacetimeDB;
using static Types;

public static class BehaviorTreeLogic
{
    public enum AIAction
    {
        None,
        MoveTowardsPickup,
        AimAndFire,
        MoveTowardsEnemy,
        Escape,
        StopMoving
    }

    public class AIDecision
    {
        public AIAction Action { get; set; }
        public Module.Tank? TargetTank { get; set; }
        public Module.Pickup? TargetPickup { get; set; }
        public int TargetX { get; set; }
        public int TargetY { get; set; }
        public bool ShouldFire { get; set; }
        public List<(int x, int y)> Path { get; set; } = new List<(int x, int y)>();
    }

    public static AIDecision EvaluateBehaviorTree(ReducerContext ctx, Module.Tank tank, BehaviorTreeAI.AIContext context)
    {
        var allTanks = context.GetAllTanks();
        var pathState = context.GetTankPath(tank.Id);
        bool isCurrentlyMoving = pathState != null && pathState.Value.Path.Length > 0;

        var nearbyTank = FindNearestTank(tank, allTanks);
        if (nearbyTank != null)
        {
            var distanceToNearby = GetDistance(tank.PositionX, tank.PositionY, nearbyTank.Value.PositionX, nearbyTank.Value.PositionY);

            if (distanceToNearby < 1)
            {
                if (isCurrentlyMoving)
                {
                    return new AIDecision { Action = AIAction.None };
                }

                var tMap = context.GetTraversibilityMap();
                if (tMap != null)
                {
                    var (escapeX, escapeY) = FindRandomEscapePosition(tank, tMap.Value, context.GetRandom());
                    if (escapeX != GetGridPosition(tank.PositionX) || escapeY != GetGridPosition(tank.PositionY))
                    {
                        return new AIDecision
                        {
                            Action = AIAction.Escape,
                            TargetX = escapeX,
                            TargetY = escapeY
                        };
                    }
                }
            }
        }

        var nearbyEnemy = FindClosestEnemy(tank, allTanks);
        if (nearbyEnemy != null)
        {
            var distanceToEnemy = GetDistance(tank.PositionX, tank.PositionY, nearbyEnemy.Value.PositionX, nearbyEnemy.Value.PositionY);

            if (distanceToEnemy <= 6f)
            {
                if (isCurrentlyMoving)
                {
                    return new AIDecision
                    {
                        Action = AIAction.StopMoving,
                        TargetTank = nearbyEnemy
                    };
                }

                return new AIDecision
                {
                    Action = AIAction.AimAndFire,
                    TargetTank = nearbyEnemy,
                    ShouldFire = true
                };
            }
        }

        bool isLowHealth = tank.Health < (tank.MaxHealth / 2);
        if (isLowHealth)
        {
            var healthPickup = FindNearestHealthPickup(tank, context.GetAllPickups());
            if (healthPickup != null)
            {
                if (isCurrentlyMoving)
                {
                    return new AIDecision { Action = AIAction.None };
                }

                var tMap = context.GetTraversibilityMap();
                if (tMap != null)
                {
                    var path = FindPathTowards(tank, (int)healthPickup.Value.PositionX, (int)healthPickup.Value.PositionY, tMap);
                    if (path.Count > 0)
                    {
                        return new AIDecision
                        {
                            Action = AIAction.MoveTowardsPickup,
                            TargetPickup = healthPickup,
                            Path = path
                        };
                    }
                }
            }
        }

        var target = FindNearestEnemy(tank, allTanks);
        if (target != null)
        {
            var distanceToTarget = GetDistance(tank.PositionX, tank.PositionY, target.Value.PositionX, target.Value.PositionY);

            if (distanceToTarget < 10f)
            {
                var tMap = context.GetTraversibilityMap();
                if (HasLineOfSight(tank, target.Value, tMap))
                {
                    if (isCurrentlyMoving)
                    {
                        return new AIDecision
                        {
                            Action = AIAction.StopMoving,
                            TargetTank = target
                        };
                    }

                    return new AIDecision
                    {
                        Action = AIAction.AimAndFire,
                        TargetTank = target,
                        ShouldFire = true
                    };
                }
            }

            if (!isCurrentlyMoving)
            {
                var tMap = context.GetTraversibilityMap();
                if (tMap != null)
                {
                    var path = FindPathTowards(tank, GetGridPosition(target.Value.PositionX), GetGridPosition(target.Value.PositionY), tMap);
                    if (path.Count > 0)
                    {
                        return new AIDecision
                        {
                            Action = AIAction.MoveTowardsEnemy,
                            TargetTank = target,
                            Path = path
                        };
                    }
                }
            }
        }

        if (!isCurrentlyMoving)
        {
            var nearbyPickup = FindNearestPickup(tank, context.GetAllPickups());
            if (nearbyPickup != null && ShouldCollectPickup(tank, nearbyPickup.Value))
            {
                var tMap = context.GetTraversibilityMap();
                if (tMap != null)
                {
                    var path = FindPathTowards(tank, (int)nearbyPickup.Value.PositionX, (int)nearbyPickup.Value.PositionY, tMap);
                    if (path.Count > 0)
                    {
                        return new AIDecision
                        {
                            Action = AIAction.MoveTowardsPickup,
                            TargetPickup = nearbyPickup,
                            Path = path
                        };
                    }
                }
            }
        }

        return new AIDecision { Action = AIAction.None };
    }

    public static bool ShouldCollectPickup(Module.Tank tank, Module.Pickup pickup)
    {
        var distance = GetDistance(tank.PositionX, tank.PositionY, (float)pickup.PositionX, (float)pickup.PositionY);
        if (distance >= 15f) return false;

        if (pickup.Type == PickupType.Health)
        {
            return tank.Health < tank.MaxHealth;
        }

        if (tank.Guns.Length >= 3) return false;

        return true;
    }

    public static Module.Tank? FindNearestEnemy(Module.Tank tank, List<Module.Tank> allTanks)
    {
        Module.Tank? nearest = null;
        float minDistanceToSpawn = float.MaxValue;

        float spawnX = tank.Alliance == 0 ? 15f : 45f;
        float spawnY = 30f;

        foreach (var enemyTank in allTanks)
        {
            if (enemyTank.Alliance == tank.Alliance || enemyTank.Health <= 0)
                continue;

            var distanceToSpawn = GetDistance(spawnX, spawnY, enemyTank.PositionX, enemyTank.PositionY);
            if (distanceToSpawn < minDistanceToSpawn)
            {
                minDistanceToSpawn = distanceToSpawn;
                nearest = enemyTank;
            }
        }

        return nearest;
    }

    public static Module.Tank? FindClosestEnemy(Module.Tank tank, List<Module.Tank> allTanks)
    {
        Module.Tank? nearest = null;
        float minDistance = float.MaxValue;

        foreach (var enemyTank in allTanks)
        {
            if (enemyTank.Alliance == tank.Alliance || enemyTank.Health <= 0)
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
            if (otherTank.Id == tank.Id || otherTank.Health <= 0)
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

        return Module.GetNormalizedAngleDifference((float)aimAngle, tank.TurretRotation);
    }

    public static Module.Pickup? FindNearestHealthPickup(Module.Tank tank, List<Module.Pickup> allPickups)
    {
        Module.Pickup? nearest = null;
        float minDistance = float.MaxValue;

        foreach (var pickup in allPickups)
        {
            if (pickup.WorldId != tank.WorldId || pickup.Type != PickupType.Health)
                continue;

            var distance = GetDistance(tank.PositionX, tank.PositionY, (float)pickup.PositionX, (float)pickup.PositionY);
            if (distance < minDistance)
            {
                minDistance = distance;
                nearest = pickup;
            }
        }

        return nearest;
    }

    public static Module.Pickup? FindNearestPickup(Module.Tank tank, List<Module.Pickup> allPickups)
    {
        Module.Pickup? nearest = null;
        float minDistance = float.MaxValue;

        foreach (var pickup in allPickups)
        {
            if (pickup.WorldId != tank.WorldId)
                continue;

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

    public static List<(int x, int y)> FindPathTowards(Module.Tank tank, int targetX, int targetY, Module.TraversibilityMap? traversibilityMap)
    {
        var emptyPath = new List<(int x, int y)>();

        if (traversibilityMap == null)
        {
            Log.Info($"[FindPathTowards] Tank {tank.Id}: traversibilityMap is null");
            return emptyPath;
        }

        int currentX = GetGridPosition(tank.PositionX);
        int currentY = GetGridPosition(tank.PositionY);

        Log.Info($"[FindPathTowards] Tank {tank.Id}: current=({currentX},{currentY}), target=({targetX},{targetY})");

        var floatPath = AStarPathfinding.FindPath(currentX, currentY, targetX, targetY, traversibilityMap.Value);
        var path = floatPath.Select(p => ((int)p.x, (int)p.y)).ToList();

        if (path.Count > 0)
        {
            Log.Info($"[FindPathTowards] Tank {tank.Id}: Found path with {path.Count} waypoints");
        }
        else
        {
            Log.Info($"[FindPathTowards] Tank {tank.Id}: No path found");
        }

        return path;
    }

    public static (int x, int y) FindRandomEscapePosition(Module.Tank tank, Module.TraversibilityMap traversibilityMap, Random rng)
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
            return validMoves[rng.Next(validMoves.Count)];
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
