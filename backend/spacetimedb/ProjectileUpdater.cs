using SpacetimeDB;
using static Types;
using System.Collections.Generic;
using static Module;

public static partial class ProjectileUpdater
{
    [Table(Scheduled = nameof(UpdateProjectiles))]
    public partial struct ScheduledProjectileUpdates
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
        public ulong LastTickAt;
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

        int searchRadius = (int)Math.Ceiling(projectile.TrackingRadius / Module.COLLISION_REGION_SIZE);

        Module.Tank? closestTarget = null;
        float closestDistanceSquared = projectile.TrackingRadius * projectile.TrackingRadius;

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

    private static (bool collided, Projectile projectile, bool mapChanged) HandleTerrainCollision(
        ReducerContext ctx,
        Projectile projectile,
        ref Module.TraversibilityMap traversibilityMap,
        string worldId,
        double deltaTime)
    {
        int projectileTileX = (int)projectile.PositionX;
        int projectileTileY = (int)projectile.PositionY;

        if (projectileTileX < 0 || projectileTileX >= traversibilityMap.Width ||
            projectileTileY < 0 || projectileTileY >= traversibilityMap.Height)
        {
            return (false, projectile, false);
        }

        int tileIndex = projectileTileY * traversibilityMap.Width + projectileTileX;
        bool tileIsTraversable = tileIndex < traversibilityMap.ProjectileCollisionMap.Length && traversibilityMap.ProjectileCollisionMap[tileIndex];

        if (projectile.PassThroughTerrain)
        {
            if (projectile.CollisionRadius > 0)
            {
                bool terrainChanged;
                (projectile, terrainChanged) = DamageTerrainInRadius(ctx, projectile, ref traversibilityMap, worldId);
                return (false, projectile, terrainChanged);
            }
            return (false, projectile, false);
        }

        if (tileIsTraversable)
        {
            return (false, projectile, false);
        }

        if (projectile.ProjectileType == ProjectileType.SpiderMine)
        {
            Module.PlantSpiderMineCommand(ctx, projectile, worldId);
            ctx.Db.projectile.Id.Delete(projectile.Id);
            return (true, projectile, false);
        }

        if (projectile.Bounce)
        {
            projectile = HandleProjectileBounce(projectile, projectileTileX, projectileTileY, deltaTime);
            return (false, projectile, false);
        }

        bool mapChanged = DamageTerrainAtTile(ctx, worldId, projectileTileX, projectileTileY, tileIndex, projectile.Damage, ref traversibilityMap);

        ctx.Db.projectile.Id.Delete(projectile.Id);
        return (true, projectile, mapChanged);
    }

    private static (Projectile projectile, bool mapChanged) DamageTerrainInRadius(
        ReducerContext ctx,
        Projectile projectile,
        ref Module.TraversibilityMap traversibilityMap,
        string worldId)
    {
        int collisionTileRadius = (int)Math.Ceiling(projectile.CollisionRadius);
        int centerTileX = (int)projectile.PositionX;
        int centerTileY = (int)projectile.PositionY;

        bool traversibilityMapChanged = false;
        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        ulong expirationThreshold = 500_000;

        var recentlyDamagedList = new System.Collections.Generic.List<DamagedTile>();
        foreach (var damagedTile in projectile.RecentlyDamagedTiles)
        {
            if (currentTime - damagedTile.DamagedAt < expirationThreshold)
            {
                recentlyDamagedList.Add(damagedTile);
            }
        }

        for (int dx = -collisionTileRadius; dx <= collisionTileRadius; dx++)
        {
            for (int dy = -collisionTileRadius; dy <= collisionTileRadius; dy++)
            {
                int tileX = centerTileX + dx;
                int tileY = centerTileY + dy;

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
                float collisionRadiusSquared = projectile.CollisionRadius * projectile.CollisionRadius;

                if (distanceSquared <= collisionRadiusSquared)
                {
                    bool alreadyDamaged = false;
                    foreach (var damagedTile in recentlyDamagedList)
                    {
                        if (damagedTile.X == tileX && damagedTile.Y == tileY)
                        {
                            alreadyDamaged = true;
                            break;
                        }
                    }

                    if (!alreadyDamaged)
                    {
                        int tileIndex = tileY * traversibilityMap.Width + tileX;
                        if (DamageTerrainAtTile(ctx, worldId, tileX, tileY, tileIndex, projectile.Damage, ref traversibilityMap))
                        {
                            traversibilityMapChanged = true;
                        }

                        recentlyDamagedList.Add(new DamagedTile
                        {
                            X = tileX,
                            Y = tileY,
                            DamagedAt = currentTime
                        });
                    }
                }
            }
        }

        projectile = projectile with
        {
            RecentlyDamagedTiles = recentlyDamagedList.ToArray()
        };

        return (projectile, traversibilityMapChanged);
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

        int existingGunIndex = -1;
        for (int i = 0; i < tank.Guns.Length; i++)
        {
            if (tank.Guns[i].GunType == GunType.Boomerang)
            {
                existingGunIndex = i;
                break;
            }
        }

        if (existingGunIndex >= 0)
        {
            var gun = tank.Guns[existingGunIndex];
            if (gun.Ammo != null)
            {
                gun.Ammo = gun.Ammo.Value + 1;
                tank.Guns[existingGunIndex] = gun;
                ctx.Db.tank.Id.Update(tank);
                Log.Info($"Tank {tank.Name} caught the boomerang! Ammo: {gun.Ammo}");
            }
        }
        else if (tank.Guns.Length < 3)
        {
            var boomerangGun = Module.BOOMERANG_GUN with { Ammo = 1 };
            var newGunIndex = tank.Guns.Length;
            tank = tank with
            {
                Guns = [.. tank.Guns, boomerangGun],
                SelectedGunIndex = newGunIndex
            };
            ctx.Db.tank.Id.Update(tank);
            Log.Info($"Tank {tank.Name} caught the boomerang! New gun added with 1 ammo.");
        }
        else
        {
            Log.Info($"Tank {tank.Name} inventory full - boomerang lost!");
        }

        ctx.Db.projectile.Id.Delete(projectile.Id);
        return true;
    }

    private static (bool collided, Projectile projectile, bool mapChanged) HandleTankCollisions(
        ReducerContext ctx,
        Projectile projectile,
        string worldId,
        ref Module.TraversibilityMap traversibilityMap,
        int minRegionX,
        int maxRegionX,
        int minRegionY,
        int maxRegionY)
    {
        float totalCollisionRadius = projectile.CollisionRadius + Module.TANK_COLLISION_RADIUS;
        float collisionRadiusSquared = totalCollisionRadius * totalCollisionRadius;

        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        ulong expirationThreshold = 500_000;

        var recentlyHitList = new System.Collections.Generic.List<DamagedTank>();
        foreach (var hitTank in projectile.RecentlyHitTanks)
        {
            if (currentTime - hitTank.DamagedAt < expirationThreshold)
            {
                recentlyHitList.Add(hitTank);
            }
        }

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
                        if (projectile.ProjectileType == ProjectileType.SpiderMine)
                        {
                            if (tank.Alliance != projectile.Alliance)
                            {
                                Module.PlantSpiderMineCommand(ctx, projectile, worldId);
                                ctx.Db.projectile.Id.Delete(projectile.Id);
                                return (true, projectile, false);
                            }
                            continue;
                        }

                        if (HandleBoomerangReturn(ctx, projectile, tank))
                        {
                            return (true, projectile, false);
                        }

                        if (tank.Alliance != projectile.Alliance && tank.Health > 0)
                        {
                            bool alreadyHit = false;
                            foreach (var hitTank in recentlyHitList)
                            {
                                if (hitTank.TankId == tank.Id)
                                {
                                    alreadyHit = true;
                                    break;
                                }
                            }

                            if (!alreadyHit)
                            {
                                if (projectile.ExplosionRadius != null && projectile.ExplosionRadius > 0)
                                {
                                    if (projectile.ExplosionTrigger == ExplosionTrigger.OnHit)
                                    {
                                        bool mapChanged = ProjectileUpdater.ExplodeProjectileCommand(ctx, projectile, worldId, ref traversibilityMap);
                                        ctx.Db.projectile.Id.Delete(projectile.Id);
                                        return (true, projectile, mapChanged);
                                    }
                                }
                                else
                                {
                                    Module.DealDamageToTankCommand(ctx, tank, projectile.Damage, projectile.ShooterTankId, projectile.Alliance, worldId);
                                }

                                recentlyHitList.Add(new DamagedTank
                                {
                                    TankId = tank.Id,
                                    DamagedAt = currentTime
                                });

                                bool shouldDelete;
                                (shouldDelete, projectile) = Module.IncrementProjectileCollision(ctx, projectile);

                                if (shouldDelete)
                                {
                                    return (true, projectile, false);
                                }
                            }
                        }
                    }
                }
            }
        }

        projectile = projectile with
        {
            RecentlyHitTanks = recentlyHitList.ToArray()
        };

        return (false, projectile, false);
    }

    private static (bool collided, Projectile projectile) HandleSpiderMineCollision(
        ReducerContext ctx,
        Projectile projectile,
        string worldId,
        int minRegionX,
        int maxRegionX,
        int minRegionY,
        int maxRegionY)
    {
        if (projectile.ProjectileType == ProjectileType.SpiderMine)
        {
            return (false, projectile);
        }

        float totalCollisionRadius = projectile.CollisionRadius + 0.2f;
        float collisionRadiusSquared = totalCollisionRadius * totalCollisionRadius;

        for (int regionX = minRegionX; regionX <= maxRegionX; regionX++)
        {
            if (regionX < 0) continue;

            for (int regionY = minRegionY; regionY <= maxRegionY; regionY++)
            {
                if (regionY < 0) continue;

                foreach (var mine in ctx.Db.spider_mine.WorldId_CollisionRegionX_CollisionRegionY.Filter((worldId, regionX, regionY)))
                {
                    if (mine.Alliance != projectile.Alliance)
                    {
                        float dx = mine.PositionX - projectile.PositionX;
                        float dy = mine.PositionY - projectile.PositionY;
                        float distanceSquared = dx * dx + dy * dy;

                        if (distanceSquared <= collisionRadiusSquared)
                        {
                            ctx.Db.spider_mine.Id.Delete(mine.Id);
                            Log.Info($"Spider mine destroyed by projectile at ({mine.PositionX}, {mine.PositionY})");

                            bool shouldDelete;
                            (shouldDelete, projectile) = Module.IncrementProjectileCollision(ctx, projectile);

                            return (shouldDelete, projectile);
                        }
                    }
                }
            }
        }

        return (false, projectile);
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

        bool traversibilityMapChanged = false;

        foreach (var iProjectile in ctx.Db.projectile.WorldId.Filter(args.WorldId))
        {
            var projectile = iProjectile;

            var projectileAgeMicros = currentTime - projectile.SpawnedAt;
            var projectileAgeSeconds = projectileAgeMicros / 1_000_000.0;

            if (projectileAgeSeconds >= projectile.LifetimeSeconds)
            {
                if (projectile.ExplosionTrigger == ExplosionTrigger.OnExpiration)
                {
                    if (ProjectileUpdater.ExplodeProjectileCommand(ctx, projectile, args.WorldId, ref traversibilityMap))
                    {
                        traversibilityMapChanged = true;
                    }
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

            float oldPositionX = projectile.PositionX;
            float oldPositionY = projectile.PositionY;
            float newPositionX = (float)(projectile.PositionX + projectile.Velocity.X * deltaTime);
            float newPositionY = (float)(projectile.PositionY + projectile.Velocity.Y * deltaTime);

            float deltaX = newPositionX - oldPositionX;
            float deltaY = newPositionY - oldPositionY;
            float distanceTraveled = (float)Math.Sqrt(deltaX * deltaX + deltaY * deltaY);

            const float MIN_STEP = 0.25f;
            int numSteps = Math.Max(1, (int)Math.Ceiling(distanceTraveled / MIN_STEP));
            double stepDeltaTime = deltaTime / numSteps;

            bool collided = false;
            bool mapChanged;

            for (int step = 0; step < numSteps && !collided; step++)
            {
                float t = (step + 0.5f) / (float)numSteps;
                float interpolatedX = oldPositionX + deltaX * t;
                float interpolatedY = oldPositionY + deltaY * t;

                projectile = projectile with
                {
                    PositionX = interpolatedX,
                    PositionY = interpolatedY
                };

                (collided, projectile, mapChanged) = HandleTerrainCollision(ctx, projectile, ref traversibilityMap, args.WorldId, stepDeltaTime);

                if (mapChanged)
                {
                    traversibilityMapChanged = true;
                }

                if (collided) break;

                var (minRegionX, maxRegionX, minRegionY, maxRegionY) = CalculateTankCollisionRegions(projectile);

                (collided, projectile, mapChanged) = HandleTankCollisions(ctx, projectile, args.WorldId, ref traversibilityMap, minRegionX, maxRegionX, minRegionY, maxRegionY);

                if (mapChanged)
                {
                    traversibilityMapChanged = true;
                }

                if (collided) break;

                (collided, projectile) = HandleSpiderMineCollision(ctx, projectile, args.WorldId, minRegionX, maxRegionX, minRegionY, maxRegionY);
            }

            if (collided) continue;

            ctx.Db.projectile.Id.Update(projectile);
        }

        if (traversibilityMapChanged)
        {
            ctx.Db.traversibility_map.WorldId.Update(traversibilityMap);
        }
    }
}
