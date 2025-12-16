using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;

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

    [Reducer]
    public static void UpdateAI(ReducerContext ctx, ScheduledAIUpdate args)
    {
        foreach (var tank in ctx.Db.tank.WorldId_IsBot.Filter((args.WorldId, true)))
        {
            if (tank.IsDead)
            {
                continue;
            }

            EvaluateBehaviorTree(ctx, tank);
        }

        ctx.Db.ScheduledAIUpdate.ScheduledId.Update(args with
        {
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = 1_000_000 })
        });
    }

    private static void EvaluateBehaviorTree(ReducerContext ctx, Module.Tank tank)
    {
        var world = ctx.Db.world.Id.Find(tank.WorldId);
        if (world == null) return;

        if (ShouldSeekCover(tank))
        {
            SeekCover(ctx, tank, world.Value);
            return;
        }

        var nearbyPickup = FindNearestPickup(ctx, tank);
        if (nearbyPickup != null && ShouldCollectPickup(tank, nearbyPickup.Value))
        {
            MoveTowardsPickup(ctx, tank, nearbyPickup.Value);
            return;
        }

        var target = FindNearestEnemy(ctx, tank);
        if (target != null)
        {
            var distanceToTarget = GetDistance(tank.PositionX, tank.PositionY, target.Value.PositionX, target.Value.PositionY);
            
            if (distanceToTarget < 10f && HasLineOfSight(ctx, tank, target.Value))
            {
                AimAndFire(ctx, tank, target.Value);
                return;
            }
        }

        MoveTowardsEnemySpawn(ctx, tank, world.Value);
    }

    private static bool ShouldSeekCover(Module.Tank tank)
    {
        return tank.Health < tank.MaxHealth * 0.3f;
    }

    private static bool ShouldCollectPickup(Module.Tank tank, Module.Pickup pickup)
    {
        if (tank.Guns.Length >= 3) return false;
        
        var distance = GetDistance(tank.PositionX, tank.PositionY, pickup.PositionX, pickup.PositionY);
        return distance < 15f;
    }

    private static Module.Tank? FindNearestEnemy(ReducerContext ctx, Module.Tank tank)
    {
        Module.Tank? nearest = null;
        float minDistance = float.MaxValue;

        foreach (var enemyTank in ctx.Db.tank.WorldId.Filter(tank.WorldId))
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
            var distance = GetDistance(tank.PositionX, tank.PositionY, pickup.PositionX, pickup.PositionY);
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
            FireWeapon(ctx, updatedTank);
        }
    }

    private static void FireWeapon(ReducerContext ctx, Module.Tank tank)
    {
        if (tank.SelectedGunIndex < 0 || tank.SelectedGunIndex >= tank.Guns.Length)
            return;

        var gun = tank.Guns[tank.SelectedGunIndex];
        if (gun.Ammo != null && gun.Ammo <= 0)
            return;

        float barrelTipX = tank.PositionX + (float)Math.Cos(tank.TurretRotation) * Module.GUN_BARREL_LENGTH;
        float barrelTipY = tank.PositionY + (float)Math.Sin(tank.TurretRotation) * Module.GUN_BARREL_LENGTH;

        CreateProjectile(ctx, tank, barrelTipX, barrelTipY, tank.TurretRotation, gun.Damage, gun.TrackingStrength, gun.ProjectileType, gun.LifetimeSeconds);

        if (gun.Ammo != null)
        {
            gun.Ammo = gun.Ammo.Value - 1;
            var updatedGuns = tank.Guns.ToArray();

            if (gun.Ammo <= 0)
            {
                var newGuns = tank.Guns.Where((_, index) => index != tank.SelectedGunIndex).ToArray();
                tank = tank with
                {
                    Guns = newGuns,
                    SelectedGunIndex = newGuns.Length > 0 ? 0 : -1
                };
            }
            else
            {
                updatedGuns[tank.SelectedGunIndex] = gun;
                tank = tank with { Guns = updatedGuns };
            }

            ctx.Db.tank.Id.Update(tank);
        }
    }

    private static void CreateProjectile(ReducerContext ctx, Module.Tank tank, float startX, float startY, float angle, int damage, float trackingStrength, ProjectileType projectileType, float lifetimeSeconds)
    {
        float velocityX = (float)Math.Cos(angle) * Module.PROJECTILE_SPEED;
        float velocityY = (float)Math.Sin(angle) * Module.PROJECTILE_SPEED;

        var projectileId = Module.GenerateId(ctx, "prj");
        var projectile = new Module.Projectile
        {
            Id = projectileId,
            WorldId = tank.WorldId,
            ShooterTankId = tank.Id,
            Alliance = tank.Alliance,
            PositionX = startX,
            PositionY = startY,
            Speed = Module.PROJECTILE_SPEED,
            Size = Module.PROJECTILE_SIZE,
            Velocity = new Vector2Float(velocityX, velocityY),
            Damage = damage,
            TrackingStrength = trackingStrength,
            ProjectileType = projectileType,
            SpawnedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            LifetimeSeconds = lifetimeSeconds
        };

        ctx.Db.projectile.Insert(projectile);
    }

    private static void MoveTowardsEnemySpawn(ReducerContext ctx, Module.Tank tank, Module.World world)
    {
        int enemySpawnX = tank.Alliance == 0 ? (world.Width * 3) / 4 : world.Width / 4;
        int enemySpawnY = world.Height / 2;

        var (intermediateX, intermediateY) = FindPathTowards(ctx, tank, enemySpawnX, enemySpawnY, world);
        
        SetMovementPath(ctx, tank, intermediateX, intermediateY);
    }

    private static void MoveTowardsPickup(ReducerContext ctx, Module.Tank tank, Module.Pickup pickup)
    {
        SetMovementPath(ctx, tank, pickup.PositionX, pickup.PositionY);
    }

    private static void SeekCover(ReducerContext ctx, Module.Tank tank, Module.World world)
    {
        var coverPosition = FindNearestCover(ctx, tank, world);
        if (coverPosition != null)
        {
            SetMovementPath(ctx, tank, coverPosition.Value.x, coverPosition.Value.y);
        }
        else
        {
            int safeX = tank.Alliance == 0 ? world.Width / 4 : (world.Width * 3) / 4;
            int safeY = world.Height / 2;
            SetMovementPath(ctx, tank, safeX, safeY);
        }
    }

    private static (int x, int y)? FindNearestCover(ReducerContext ctx, Module.Tank tank, Module.World world)
    {
        (int x, int y)? nearest = null;
        float minDistance = float.MaxValue;

        int searchRadius = 10;
        int tankX = (int)tank.PositionX;
        int tankY = (int)tank.PositionY;

        for (int dx = -searchRadius; dx <= searchRadius; dx++)
        {
            for (int dy = -searchRadius; dy <= searchRadius; dy++)
            {
                int x = tankX + dx;
                int y = tankY + dy;

                if (x < 0 || x >= world.Width || y < 0 || y >= world.Height)
                    continue;

                var terrainDetail = ctx.Db.terrain_detail.WorldId_PositionX_PositionY.Filter((tank.WorldId, x, y)).FirstOrDefault();
                if (terrainDetail.Type == TerrainDetailType.Rock || 
                    terrainDetail.Type == TerrainDetailType.Tree ||
                    terrainDetail.Type == TerrainDetailType.Cliff)
                {
                    var distance = GetDistance(tank.PositionX, tank.PositionY, x, y);
                    if (distance < minDistance)
                    {
                        minDistance = distance;
                        nearest = (x, y);
                    }
                }
            }
        }

        return nearest;
    }

    private static (int x, int y) FindPathTowards(ReducerContext ctx, Module.Tank tank, int targetX, int targetY, Module.World world)
    {
        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(tank.WorldId);
        if (traversibilityMap == null)
        {
            return (targetX, targetY);
        }

        int currentX = (int)tank.PositionX;
        int currentY = (int)tank.PositionY;

        int dx = Math.Sign(targetX - currentX);
        int dy = Math.Sign(targetY - currentY);

        int intermediateX = currentX + dx * 3;
        int intermediateY = currentY + dy * 3;

        intermediateX = Math.Clamp(intermediateX, 0, world.Width - 1);
        intermediateY = Math.Clamp(intermediateY, 0, world.Height - 1);

        int index = intermediateY * world.Width + intermediateX;
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
