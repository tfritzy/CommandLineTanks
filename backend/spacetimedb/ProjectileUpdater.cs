using SpacetimeDB;
using static Types;
using System.Collections.Generic;
using static Module;

public static partial class ProjectileUpdater
{
    [Table(Scheduled = nameof(UpdateProjectiles))]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId) })]
    public partial struct ScheduledProjectileUpdates
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        public string WorldId;
        public ulong LastTickAt;
    }

    private static Module.TraversibilityMap ExplodeProjectile(ReducerContext ctx, Projectile projectile, string worldId, Module.TraversibilityMap traversibilityMap)
    {
        if (projectile.ExplosionRadius == null || projectile.ExplosionRadius <= 0)
        {
            return traversibilityMap;
        }

        float explosionRadius = projectile.ExplosionRadius.Value;
        int projectileCollisionRegionX = (int)(projectile.PositionX / Module.COLLISION_REGION_SIZE);
        int projectileCollisionRegionY = (int)(projectile.PositionY / Module.COLLISION_REGION_SIZE);

        int searchRadius = (int)Math.Ceiling(explosionRadius / Module.COLLISION_REGION_SIZE);

        for (int dx = -searchRadius; dx <= searchRadius; dx++)
        {
            for (int dy = -searchRadius; dy <= searchRadius; dy++)
            {
                int regionX = projectileCollisionRegionX + dx;
                int regionY = projectileCollisionRegionY + dy;

                foreach (var tank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((worldId, regionX, regionY)))
                {
                    if (tank.Health > 0 && tank.Alliance != projectile.Alliance)
                    {
                        float dx_tank = tank.PositionX - projectile.PositionX;
                        float dy_tank = tank.PositionY - projectile.PositionY;
                        float distanceSquared = dx_tank * dx_tank + dy_tank * dy_tank;
                        float explosionRadiusSquared = explosionRadius * explosionRadius;

                        if (distanceSquared <= explosionRadiusSquared)
                        {
                            HandleTankDamage(ctx, tank, projectile, worldId);
                        }
                    }
                }
            }
        }

        int explosionTileRadius = (int)Math.Ceiling(explosionRadius);
        int explosionTileX = (int)projectile.PositionX;
        int explosionTileY = (int)projectile.PositionY;

        bool traversibilityMapChanged = false;

        for (int dx = -explosionTileRadius; dx <= explosionTileRadius; dx++)
        {
            for (int dy = -explosionTileRadius; dy <= explosionTileRadius; dy++)
            {
                int tileX = explosionTileX + dx;
                int tileY = explosionTileY + dy;

                if (tileX < 0 || tileX >= traversibilityMap.Width ||
                    tileY < 0 || tileY >= traversibilityMap.Height)
                {
                    continue;
                }

                float tileCenterX = tileX + 0.5f;
                float tileCenterY = tileY + 0.5f;

                float dx_tile = tileCenterX - projectile.PositionX;
                float dy_tile = tileCenterY - projectile.PositionY;
                float distanceSquared = dx_tile * dx_tile + dy_tile * dy_tile;
                float explosionRadiusSquared = explosionRadius * explosionRadius;

                if (distanceSquared <= explosionRadiusSquared)
                {
                    foreach (var terrainDetail in ctx.Db.terrain_detail.WorldId_PositionX_PositionY.Filter((worldId, tileCenterX, tileCenterY)))
                    {
                        if (terrainDetail.Health == null)
                        {
                            continue;
                        }

                        var newHealth = terrainDetail.Health.Value - projectile.Damage;
                        if (newHealth <= 0)
                        {
                            ctx.Db.terrain_detail.Id.Delete(terrainDetail.Id);

                            int tileIndex = tileY * traversibilityMap.Width + tileX;
                            traversibilityMap.Map[tileIndex] = true;
                            traversibilityMapChanged = true;
                        }
                        else
                        {
                            ctx.Db.terrain_detail.Id.Update(terrainDetail with
                            {
                                Health = newHealth
                            });
                        }
                    }
                }
            }
        }

        if (traversibilityMapChanged)
        {
            ctx.Db.traversibility_map.WorldId.Update(traversibilityMap);
        }

        Log.Info($"Projectile exploded at ({projectile.PositionX}, {projectile.PositionY})");
        return traversibilityMap;
    }

    private static void HandleTankDamage(ReducerContext ctx, Module.Tank tank, Projectile projectile, string worldId)
    {
        var newHealth = tank.Health - projectile.Damage;
        var updatedTank = tank with
        {
            Health = newHealth
        };
        ctx.Db.tank.Id.Update(updatedTank);

        if (newHealth <= 0)
        {
            var shooterTank = ctx.Db.tank.Id.Find(projectile.ShooterTankId);
            if (shooterTank != null)
            {
                var updatedShooterTank = shooterTank.Value with
                {
                    Kills = shooterTank.Value.Kills + 1
                };
                ctx.Db.tank.Id.Update(updatedShooterTank);

                var killeeName = tank.IsBot ? $"[Bot] {tank.Name}" : tank.Name;
                ctx.Db.kills.Insert(new Module.Kill
                {
                    Id = Module.GenerateId(ctx, "k"),
                    WorldId = worldId,
                    Killer = shooterTank.Value.Owner,
                    KilleeName = killeeName,
                    Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
                });
            }

            var score = ctx.Db.score.WorldId.Find(worldId);
            if (score != null)
            {
                var updatedScore = score.Value;
                if (projectile.Alliance >= 0 && projectile.Alliance < updatedScore.Kills.Length)
                {
                    updatedScore.Kills[projectile.Alliance]++;
                    ctx.Db.score.WorldId.Update(updatedScore);
                }
            }
        }
    }

    private static Projectile UpdateBoomerangVelocity(Projectile projectile, double projectileAgeSeconds)
    {
        if (!projectile.ReturnsToShooter)
        {
            return projectile;
        }

        if (!projectile.IsReturning && projectileAgeSeconds >= projectile.LifetimeSeconds / 2.0)
        {
            projectile = projectile with
            {
                Velocity = new Vector2Float(-projectile.Velocity.X, -projectile.Velocity.Y),
                IsReturning = true
            };
        }

        float progress = (float)(projectileAgeSeconds / projectile.LifetimeSeconds);
        float speedMultiplier;

        if (progress < 0.5f)
        {
            speedMultiplier = 1.0f - (progress * 0.8f);
        }
        else
        {
            speedMultiplier = 0.6f + ((progress - 0.5f) * 1.6f);
        }

        float currentSpeed = projectile.Speed * speedMultiplier;
        float angle = (float)Math.Atan2(projectile.Velocity.Y, projectile.Velocity.X);

        return projectile with
        {
            Velocity = new Vector2Float(
                (float)(Math.Cos(angle) * currentSpeed),
                (float)(Math.Sin(angle) * currentSpeed)
            )
        };
    }

    private static Projectile UpdateMissileTracking(ReducerContext ctx, Projectile projectile, string worldId, double deltaTime)
    {
        if (projectile.TrackingStrength <= 0)
        {
            return projectile;
        }

        int projectileCollisionRegionX = (int)(projectile.PositionX / Module.COLLISION_REGION_SIZE);
        int projectileCollisionRegionY = (int)(projectile.PositionY / Module.COLLISION_REGION_SIZE);

        int searchRadius = (int)Math.Ceiling(Module.MISSILE_TRACKING_RADIUS / Module.COLLISION_REGION_SIZE);

        Module.Tank? closestTarget = null;
        float closestDistanceSquared = Module.MISSILE_TRACKING_RADIUS * Module.MISSILE_TRACKING_RADIUS;

        for (int deltaX = -searchRadius; deltaX <= searchRadius; deltaX++)
        {
            for (int deltaY = -searchRadius; deltaY <= searchRadius; deltaY++)
            {
                int regionX = projectileCollisionRegionX + deltaX;
                int regionY = projectileCollisionRegionY + deltaY;

                foreach (var tank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((worldId, regionX, regionY)))
                {
                    if (tank.Alliance != projectile.Alliance && tank.Health > 0)
                    {
                        var dx_tank = tank.PositionX - projectile.PositionX;
                        var dy_tank = tank.PositionY - projectile.PositionY;
                        var distanceSquared = dx_tank * dx_tank + dy_tank * dy_tank;

                        if (distanceSquared < closestDistanceSquared)
                        {
                            closestDistanceSquared = distanceSquared;
                            closestTarget = tank;
                        }
                    }
                }
            }
        }

        if (closestTarget == null)
        {
            return projectile;
        }

        var targetDx = closestTarget.Value.PositionX - projectile.PositionX;
        var targetDy = closestTarget.Value.PositionY - projectile.PositionY;
        var targetAngle = Math.Atan2(targetDy, targetDx);

        var currentAngle = Math.Atan2(projectile.Velocity.Y, projectile.Velocity.X);
        var angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        var turnAmount = Math.Sign(angleDiff) * Math.Min(Math.Abs(angleDiff), projectile.TrackingStrength * deltaTime);
        var newAngle = currentAngle + turnAmount;

        return projectile with
        {
            Velocity = new Vector2Float(
                (float)(Math.Cos(newAngle) * projectile.Speed),
                (float)(Math.Sin(newAngle) * projectile.Speed)
            )
        };
    }

    private static (bool collided, Projectile projectile, Module.TraversibilityMap traversibilityMap) HandleTerrainCollision(
        ReducerContext ctx,
        Projectile projectile,
        Module.TraversibilityMap traversibilityMap,
        string worldId,
        double deltaTime)
    {
        int projectileTileX = (int)projectile.PositionX;
        int projectileTileY = (int)projectile.PositionY;

        if (projectileTileX < 0 || projectileTileX >= traversibilityMap.Width ||
            projectileTileY < 0 || projectileTileY >= traversibilityMap.Height)
        {
            return (false, projectile, traversibilityMap);
        }

        int tileIndex = projectileTileY * traversibilityMap.Width + projectileTileX;
        bool tileIsTraversable = tileIndex < traversibilityMap.Map.Length && traversibilityMap.Map[tileIndex];

        if (tileIsTraversable || projectile.PassThroughTerrain)
        {
            return (false, projectile, traversibilityMap);
        }

        if (projectile.Bounce)
        {
            projectile = HandleProjectileBounce(projectile, projectileTileX, projectileTileY, deltaTime);
            return (false, projectile, traversibilityMap);
        }

        float centerX = projectileTileX + 0.5f;
        float centerY = projectileTileY + 0.5f;
        foreach (var terrainDetail in ctx.Db.terrain_detail.WorldId_PositionX_PositionY.Filter((worldId, centerX, centerY)))
        {
            if (terrainDetail.Health == null)
            {
                continue;
            }

            var newHealth = terrainDetail.Health.Value - projectile.Damage;
            if (newHealth <= 0)
            {
                ctx.Db.terrain_detail.Id.Delete(terrainDetail.Id);

                traversibilityMap.Map[tileIndex] = true;
                ctx.Db.traversibility_map.WorldId.Update(traversibilityMap);
            }
            else
            {
                ctx.Db.terrain_detail.Id.Update(terrainDetail with
                {
                    Health = newHealth
                });
            }

            ctx.Db.projectile.Id.Delete(projectile.Id);
            return (true, projectile, traversibilityMap);
        }

        return (false, projectile, traversibilityMap);
    }

    private static Projectile HandleProjectileBounce(Projectile projectile, int projectileTileX, int projectileTileY, double deltaTime)
    {
        float previousX = projectile.PositionX - projectile.Velocity.X * (float)deltaTime;
        float previousY = projectile.PositionY - projectile.Velocity.Y * (float)deltaTime;

        int prevTileX = (int)previousX;
        int prevTileY = (int)previousY;

        bool bounceX = prevTileX != projectileTileX;
        bool bounceY = prevTileY != projectileTileY;

        float newVelX = projectile.Velocity.X;
        float newVelY = projectile.Velocity.Y;
        float newPosX = projectile.PositionX;
        float newPosY = projectile.PositionY;

        if (bounceX)
        {
            newVelX = -projectile.Velocity.X;
            newPosX = previousX;
        }
        if (bounceY)
        {
            newVelY = -projectile.Velocity.Y;
            newPosY = previousY;
        }

        return projectile with
        {
            PositionX = newPosX,
            PositionY = newPosY,
            Velocity = new Vector2Float(newVelX, newVelY),
            Speed = (float)Math.Sqrt(newVelX * newVelX + newVelY * newVelY)
        };
    }

    private static (int minRegionX, int maxRegionX, int minRegionY, int maxRegionY) CalculateTankCollisionRegions(Projectile projectile)
    {
        int tankCollisionRegionX = (int)(projectile.PositionX / Module.COLLISION_REGION_SIZE);
        int tankCollisionRegionY = (int)(projectile.PositionY / Module.COLLISION_REGION_SIZE);

        float regionLocalX = projectile.PositionX - (tankCollisionRegionX * Module.COLLISION_REGION_SIZE);
        float regionLocalY = projectile.PositionY - (tankCollisionRegionY * Module.COLLISION_REGION_SIZE);

        float totalCollisionRadius = projectile.CollisionRadius + Module.TANK_COLLISION_RADIUS;

        int minRegionX = tankCollisionRegionX;
        int maxRegionX = tankCollisionRegionX;
        int minRegionY = tankCollisionRegionY;
        int maxRegionY = tankCollisionRegionY;

        if (regionLocalX < totalCollisionRadius)
        {
            minRegionX = tankCollisionRegionX - 1;
        }
        else if (regionLocalX > Module.COLLISION_REGION_SIZE - totalCollisionRadius)
        {
            maxRegionX = tankCollisionRegionX + 1;
        }

        if (regionLocalY < totalCollisionRadius)
        {
            minRegionY = tankCollisionRegionY - 1;
        }
        else if (regionLocalY > Module.COLLISION_REGION_SIZE - totalCollisionRadius)
        {
            maxRegionY = tankCollisionRegionY + 1;
        }

        return (minRegionX, maxRegionX, minRegionY, maxRegionY);
    }

    private static bool HandleBoomerangReturn(ReducerContext ctx, Projectile projectile, Module.Tank tank)
    {
        if (!projectile.ReturnsToShooter || !projectile.IsReturning || tank.Id != projectile.ShooterTankId)
        {
            return false;
        }

        for (int i = 0; i < tank.Guns.Length; i++)
        {
            if (tank.Guns[i].GunType == GunType.Boomerang)
            {
                var gun = tank.Guns[i];
                if (gun.Ammo != null)
                {
                    gun.Ammo = gun.Ammo.Value + 1;
                    tank.Guns[i] = gun;
                    ctx.Db.tank.Id.Update(tank);
                    Log.Info($"Tank {tank.Name} caught the boomerang! Ammo restored.");
                }
                break;
            }
        }

        ctx.Db.projectile.Id.Delete(projectile.Id);
        return true;
    }

    private static (bool collided, Projectile projectile, Module.TraversibilityMap traversibilityMap) HandleTankCollisions(
        ReducerContext ctx,
        Projectile projectile,
        string worldId,
        Module.TraversibilityMap traversibilityMap,
        int minRegionX,
        int maxRegionX,
        int minRegionY,
        int maxRegionY)
    {
        float totalCollisionRadius = projectile.CollisionRadius + Module.TANK_COLLISION_RADIUS;
        float collisionRadiusSquared = totalCollisionRadius * totalCollisionRadius;

        for (int regionX = minRegionX; regionX <= maxRegionX; regionX++)
        {
            if (regionX < 0) continue;

            for (int regionY = minRegionY; regionY <= maxRegionY; regionY++)
            {
                if (regionY < 0) continue;

                foreach (var tank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((worldId, regionX, regionY)))
                {
                    float dx = tank.PositionX - projectile.PositionX;
                    float dy = tank.PositionY - projectile.PositionY;
                    float distanceSquared = dx * dx + dy * dy;

                    if (distanceSquared <= collisionRadiusSquared)
                    {
                        if (HandleBoomerangReturn(ctx, projectile, tank))
                        {
                            return (true, projectile, traversibilityMap);
                        }

                        if (tank.Alliance != projectile.Alliance && tank.Health > 0)
                        {
                            if (projectile.ExplosionRadius != null && projectile.ExplosionRadius > 0)
                            {
                                if (projectile.ExplosionTrigger == ExplosionTrigger.OnHit)
                                {
                                    traversibilityMap = ExplodeProjectile(ctx, projectile, worldId, traversibilityMap);
                                    ctx.Db.projectile.Id.Delete(projectile.Id);
                                    return (true, projectile, traversibilityMap);
                                }
                            }
                            else
                            {
                                HandleTankDamage(ctx, tank, projectile, worldId);
                            }

                            projectile = projectile with
                            {
                                CollisionCount = projectile.CollisionCount + 1
                            };

                            if (projectile.CollisionCount >= projectile.MaxCollisions)
                            {
                                ctx.Db.projectile.Id.Delete(projectile.Id);
                                return (true, projectile, traversibilityMap);
                            }
                        }
                    }
                }
            }
        }

        return (false, projectile, traversibilityMap);
    }

    [Reducer]
    public static void UpdateProjectiles(ReducerContext ctx, ScheduledProjectileUpdates args)
    {
        var currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var deltaTimeMicros = currentTime - args.LastTickAt;
        var deltaTime = deltaTimeMicros / 1_000_000.0;

        ctx.Db.ScheduledProjectileUpdates.ScheduledId.Update(args with
        {
            LastTickAt = currentTime
        });

        var traversibilityMapQuery = ctx.Db.traversibility_map.WorldId.Find(args.WorldId);
        if (traversibilityMapQuery == null) return;
        var traversibilityMap = traversibilityMapQuery.Value;

        foreach (var iProjectile in ctx.Db.projectile.WorldId.Filter(args.WorldId))
        {
            var projectile = iProjectile;

            var projectileAgeMicros = currentTime - projectile.SpawnedAt;
            var projectileAgeSeconds = projectileAgeMicros / 1_000_000.0;

            if (projectileAgeSeconds >= projectile.LifetimeSeconds)
            {
                if (projectile.ExplosionTrigger == ExplosionTrigger.OnExpiration)
                {
                    traversibilityMap = ExplodeProjectile(ctx, projectile, args.WorldId, traversibilityMap);
                }
                ctx.Db.projectile.Id.Delete(projectile.Id);
                continue;
            }

            projectile = UpdateBoomerangVelocity(projectile, projectileAgeSeconds);

            projectile = UpdateMissileTracking(ctx, projectile, args.WorldId, deltaTime);

            if (projectile.Damping != null && projectile.Damping > 0 && projectile.Damping < 1)
            {
                float dampingFactor = (float)Math.Pow(projectile.Damping.Value, deltaTime);
                projectile = projectile with
                {
                    Velocity = new Vector2Float(
                        projectile.Velocity.X * dampingFactor,
                        projectile.Velocity.Y * dampingFactor
                    ),
                    Speed = projectile.Speed * dampingFactor
                };
            }

            projectile = projectile with
            {
                PositionX = (float)(projectile.PositionX + projectile.Velocity.X * deltaTime),
                PositionY = (float)(projectile.PositionY + projectile.Velocity.Y * deltaTime)
            };

            bool collided;
            (collided, projectile, traversibilityMap) = HandleTerrainCollision(ctx, projectile, traversibilityMap, args.WorldId, deltaTime);

            if (collided) continue;

            var (minRegionX, maxRegionX, minRegionY, maxRegionY) = CalculateTankCollisionRegions(projectile);

            (collided, projectile, traversibilityMap) = HandleTankCollisions(ctx, projectile, args.WorldId, traversibilityMap, minRegionX, maxRegionX, minRegionY, maxRegionY);

            if (!collided)
            {
                ctx.Db.projectile.Id.Update(projectile);
            }
        }
    }
}
