using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;

public static partial class BehaviorTreeAI
{
    [Table(Scheduled = nameof(UpdateAI))]
    public partial struct ScheduledAIUpdate
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        public string WorldId;
    }

    private class AIContext
    {
        private readonly ReducerContext _ctx;
        private readonly string _worldId;
        private List<Module.Tank>? _allTanks;

        public AIContext(ReducerContext ctx, string worldId)
        {
            _ctx = ctx;
            _worldId = worldId;
        }

        public List<Module.Tank> GetAllTanks()
        {
            if (_allTanks == null)
            {
                _allTanks = _ctx.Db.tank.WorldId.Filter(_worldId).ToList();
            }
            return _allTanks;
        }
    }

    [Reducer]
    public static void UpdateAI(ReducerContext ctx, ScheduledAIUpdate args)
    {
        var aiContext = new AIContext(ctx, args.WorldId);

        foreach (var tank in ctx.Db.tank.WorldId_IsBot.Filter((args.WorldId, true)))
        {
            if (tank.IsDead)
            {
                var respawnedTank = Module.RespawnTank(ctx, tank, args.WorldId, tank.Alliance);
                ctx.Db.tank.Id.Update(respawnedTank);
                continue;
            }

            EvaluateBehaviorTree(ctx, tank, aiContext);
        }

        ctx.Db.ScheduledAIUpdate.ScheduledId.Update(args with
        {
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = 1_000_000 })
        });
    }

    private static void EvaluateBehaviorTree(ReducerContext ctx, Module.Tank tank, AIContext aiContext)
    {
        var nearbyPickup = FindNearestPickup(ctx, tank);
        if (nearbyPickup != null && ShouldCollectPickup(tank, nearbyPickup.Value))
        {
            MoveTowardsPickup(ctx, tank, nearbyPickup.Value);
            return;
        }

        var target = FindNearestEnemy(tank, aiContext.GetAllTanks());
        if (target != null)
        {
            var distanceToTarget = GetDistance(tank.PositionX, tank.PositionY, target.Value.PositionX, target.Value.PositionY);

            if (distanceToTarget < 10f && HasLineOfSight(ctx, tank, target.Value))
            {
                AimAndFire(ctx, tank, target.Value);
                return;
            }
        }

        MoveTowardsEnemySpawn(ctx, tank);
    }

    private static bool ShouldCollectPickup(Module.Tank tank, Module.Pickup pickup)
    {
        if (tank.Guns.Length >= 3) return false;

        var distance = GetDistance(tank.PositionX, tank.PositionY, (float)pickup.PositionX, (float)pickup.PositionY);
        return distance < 15f;
    }

    private static Module.Tank? FindNearestEnemy(Module.Tank tank, List<Module.Tank> allTanks)
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

    private static Module.Pickup? FindNearestPickup(ReducerContext ctx, Module.Tank tank)
    {
        Module.Pickup? nearest = null;
        float minDistance = float.MaxValue;

        foreach (var pickup in ctx.Db.pickup.WorldId.Filter(tank.WorldId))
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

    private static float GetDistance(float x1, float y1, float x2, float y2)
    {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return (float)Math.Sqrt(dx * dx + dy * dy);
    }

    private static bool HasLineOfSight(ReducerContext ctx, Module.Tank tank, Module.Tank target)
    {
        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(tank.WorldId);
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
            var checkX = Module.GetGridPosition(tank.PositionX + stepX * i);
            var checkY = Module.GetGridPosition(tank.PositionY + stepY * i);

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

    private static void AimAndFire(ReducerContext ctx, Module.Tank tank, Module.Tank target)
    {
        var deltaX = target.PositionX - tank.PositionX;
        var deltaY = target.PositionY - tank.PositionY;
        var aimAngle = Math.Atan2(deltaY, deltaX);

        var updatedTank = tank with
        {
            Target = target.Id,
            TargetLead = 0.5f,
            TargetTurretRotation = (float)aimAngle
        };
        ctx.Db.tank.Id.Update(updatedTank);

        var turretAngleDiff = aimAngle - tank.TurretRotation;
        while (turretAngleDiff > Math.PI) turretAngleDiff -= 2 * Math.PI;
        while (turretAngleDiff < -Math.PI) turretAngleDiff += 2 * Math.PI;

        if (Math.Abs(turretAngleDiff) < 0.1f)
        {
            Module.FireTankWeapon(ctx, updatedTank);
        }
    }

    private static void MoveTowardsEnemySpawn(ReducerContext ctx, Module.Tank tank)
    {
        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(tank.WorldId);
        if (traversibilityMap == null) return;

        int enemySpawnX = tank.Alliance == 0 ? (traversibilityMap.Value.Width * 3) / 4 : traversibilityMap.Value.Width / 4;
        int enemySpawnY = traversibilityMap.Value.Height / 2;

        var (intermediateX, intermediateY) = FindPathTowards(ctx, tank, enemySpawnX, enemySpawnY);
        
        int currentX = Module.GetGridPosition(tank.PositionX);
        int currentY = Module.GetGridPosition(tank.PositionY);
        
        if (intermediateX == currentX && intermediateY == currentY)
        {
            return;
        }

        SetMovementPath(ctx, tank, intermediateX, intermediateY);
    }

    private static void MoveTowardsPickup(ReducerContext ctx, Module.Tank tank, Module.Pickup pickup)
    {
        SetMovementPath(ctx, tank, pickup.PositionX, pickup.PositionY);
    }

    private static (int x, int y) FindPathTowards(ReducerContext ctx, Module.Tank tank, int targetX, int targetY)
    {
        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(tank.WorldId);
        if (traversibilityMap == null)
        {
            return (targetX, targetY);
        }

        int currentX = Module.GetGridPosition(tank.PositionX);
        int currentY = Module.GetGridPosition(tank.PositionY);

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

    private static void SetMovementPath(ReducerContext ctx, Module.Tank tank, int targetX, int targetY)
    {
        var entry = new PathEntry
        {
            Position = new Vector2(targetX, targetY),
            ThrottlePercent = 1.0f,
            Reverse = false
        };

        var updatedTank = tank with
        {
            Path = [entry],
            Velocity = new Vector2Float(0, 0),
            BodyAngularVelocity = 0
        };

        ctx.Db.tank.Id.Update(updatedTank);
    }
}
