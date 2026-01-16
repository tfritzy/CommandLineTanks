using SpacetimeDB;
using static Types;
using System.Collections.Generic;
using static Module;

public static partial class ProjectileUpdater
{
    private const int COLLISION_TRACKING_BUFFER_SIZE = 128;
    private const ulong LATE_UPDATE_THRESHOLD_MICROS = Module.NETWORK_TICK_RATE_MICROS * 2;

    [ThreadStatic]
    private static Dictionary<ulong, Module.ProjectileTransform>? _transformCache;
    
    [ThreadStatic]
    private static Dictionary<(int, int), List<(Module.Tank, Module.TankTransform)>>? _tanksByRegion;
    
    [ThreadStatic]
    private static Dictionary<string, Module.Tank>? _tanksById;
    
    [ThreadStatic]
    private static List<Module.Projectile>? _projectileList;

    [Table(Scheduled = nameof(UpdateProjectiles))]
    public partial struct ScheduledProjectileUpdates
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string GameId;
        public ulong LastTickAt;
        public ulong TickCount;
    }

    private static Dictionary<ulong, Module.ProjectileTransform> GetTransformCache()
    {
        if (_transformCache == null)
            _transformCache = new Dictionary<ulong, Module.ProjectileTransform>();
        else
            _transformCache.Clear();
        return _transformCache;
    }

    private static Dictionary<(int, int), List<(Module.Tank, Module.TankTransform)>> GetTanksByRegionCache()
    {
        if (_tanksByRegion == null)
            _tanksByRegion = new Dictionary<(int, int), List<(Module.Tank, Module.TankTransform)>>();
        else
        {
            foreach (var list in _tanksByRegion.Values)
                list.Clear();
            _tanksByRegion.Clear();
        }
        return _tanksByRegion;
    }

    private static Dictionary<string, Module.Tank> GetTanksByIdCache()
    {
        if (_tanksById == null)
            _tanksById = new Dictionary<string, Module.Tank>();
        else
            _tanksById.Clear();
        return _tanksById;
    }

    private static List<Module.Projectile> GetProjectileList()
    {
        if (_projectileList == null)
            _projectileList = new List<Module.Projectile>();
        else
            _projectileList.Clear();
        return _projectileList;
    }

    [ThreadStatic]
    private static List<(Module.Tank, Module.TankTransform)>? _reusableTankList;

    private static List<(Module.Tank, Module.TankTransform)> GetOrCreateTankList()
    {
        return _reusableTankList ??= new List<(Module.Tank, Module.TankTransform)>();
    }

    private static void BuildTankSpatialCache(
        ReducerContext ctx,
        string gameId,
        Dictionary<(int, int), List<(Module.Tank, Module.TankTransform)>> tanksByRegion,
        Dictionary<string, Module.Tank> tanksById)
    {
        foreach (var tank in ctx.Db.tank.GameId.Filter(gameId))
        {
            tanksById[tank.Id] = tank;
        }

        foreach (var tankTransform in ctx.Db.tank_transform.GameId.Filter(gameId))
        {
            if (!tanksById.TryGetValue(tankTransform.TankId, out var tank))
                continue;

            var regionKey = (tankTransform.CollisionRegionX, tankTransform.CollisionRegionY);
            if (!tanksByRegion.TryGetValue(regionKey, out var list))
            {
                list = new List<(Module.Tank, Module.TankTransform)>(4);
                tanksByRegion[regionKey] = list;
            }
            list.Add((tank, tankTransform));
        }
    }

    private static (Module.Projectile projectile, Module.ProjectileTransform transform) UpdateBoomerangVelocity(Module.Projectile projectile, Module.ProjectileTransform transform, double projectileAgeSeconds)
    {
        if (!projectile.ReturnsToShooter)
        {
            return (projectile, transform);
        }

        if (!projectile.IsReturning && projectileAgeSeconds >= projectile.LifetimeSeconds / 2.0)
        {
            transform = transform with
            {
                Velocity = new Vector2Float(-transform.Velocity.X, -transform.Velocity.Y)
            };
            projectile = projectile with { IsReturning = true };
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
        float angle = (float)Math.Atan2(transform.Velocity.Y, transform.Velocity.X);

        return (projectile, transform with
        {
            Velocity = new Vector2Float(
                (float)(Math.Cos(angle) * currentSpeed),
                (float)(Math.Sin(angle) * currentSpeed)
            )
        });
    }

    private static Module.ProjectileTransform UpdateMissileTracking(
        Module.Projectile projectile,
        Module.ProjectileTransform transform,
        Dictionary<(int, int), List<(Module.Tank, Module.TankTransform)>> tanksByRegion,
        double deltaTime)
    {
        if (projectile.TrackingStrength <= 0)
        {
            return transform;
        }

        int projectileCollisionRegionX = (int)(transform.PositionX / Module.COLLISION_REGION_SIZE);
        int projectileCollisionRegionY = (int)(transform.PositionY / Module.COLLISION_REGION_SIZE);

        int searchRadius = (int)Math.Ceiling(projectile.TrackingRadius / Module.COLLISION_REGION_SIZE);

        Module.TankTransform? closestPosition = null;
        float closestDistanceSquared = projectile.TrackingRadius * projectile.TrackingRadius;

        for (int deltaX = -searchRadius; deltaX <= searchRadius; deltaX++)
        {
            for (int deltaY = -searchRadius; deltaY <= searchRadius; deltaY++)
            {
                int regionX = projectileCollisionRegionX + deltaX;
                int regionY = projectileCollisionRegionY + deltaY;

                if (!tanksByRegion.TryGetValue((regionX, regionY), out var tanksInRegion))
                    continue;

                foreach (var (tank, tankTransform) in tanksInRegion)
                {
                    if (tank.Alliance != projectile.Alliance && tank.Health > 0)
                    {
                        var dx_tank = tankTransform.PositionX - transform.PositionX;
                        var dy_tank = tankTransform.PositionY - transform.PositionY;
                        var distanceSquared = dx_tank * dx_tank + dy_tank * dy_tank;

                        if (distanceSquared < closestDistanceSquared)
                        {
                            closestDistanceSquared = distanceSquared;
                            closestPosition = tankTransform;
                        }
                    }
                }
            }
        }

        if (closestPosition == null)
        {
            return transform;
        }

        var targetDx = closestPosition.Value.PositionX - transform.PositionX;
        var targetDy = closestPosition.Value.PositionY - transform.PositionY;
        var targetAngle = Math.Atan2(targetDy, targetDx);

        var currentAngle = Math.Atan2(transform.Velocity.Y, transform.Velocity.X);
        var angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        var turnAmount = Math.Sign(angleDiff) * Math.Min(Math.Abs(angleDiff), projectile.TrackingStrength * deltaTime);
        var newAngle = currentAngle + turnAmount;

        return transform with
        {
            Velocity = new Vector2Float(
                (float)(Math.Cos(newAngle) * projectile.Speed),
                (float)(Math.Sin(newAngle) * projectile.Speed)
            )
        };
    }

    private static (bool collided, Module.Projectile projectile, Module.ProjectileTransform transform) HandleTerrainCollision(
        ReducerContext ctx,
        Module.Projectile projectile,
        Module.ProjectileTransform transform,
        ref Module.ProjectileTraversibilityMap projectileTraversibilityMap,
        ref Module.TraversibilityMap traversibilityMap,
        string gameId,
        double deltaTime)
    {
        int projectileTileX = (int)transform.PositionX;
        int projectileTileY = (int)transform.PositionY;

        if (projectileTileX < 0 || projectileTileX >= projectileTraversibilityMap.Width ||
            projectileTileY < 0 || projectileTileY >= projectileTraversibilityMap.Height)
        {
            return (false, projectile, transform);
        }

        int tileIndex = projectileTileY * projectileTraversibilityMap.Width + projectileTileX;
        bool tileIsTraversable = tileIndex < projectileTraversibilityMap.Map.Length * 8 && projectileTraversibilityMap.IsTraversable(tileIndex);

        if (projectile.PassThroughTerrain)
        {
            if (projectile.CollisionRadius > 0)
            {
                (projectile, transform) = DamageTerrainInRadius(ctx, projectile, transform, ref traversibilityMap, ref projectileTraversibilityMap, gameId);
                return (false, projectile, transform);
            }
            return (false, projectile, transform);
        }

        if (tileIsTraversable)
        {
return (false, projectile, transform);
        }

        if (projectile.Bounce)
        {
            (projectile, transform) = HandleProjectileBounce(projectile, transform, projectileTileX, projectileTileY, deltaTime);
            return (false, projectile, transform);
        }

        if (projectile.ExplosionRadius != null && projectile.ExplosionRadius > 0 && projectile.ExplosionTrigger == ExplosionTrigger.OnHit)
        {
            ExplodeProjectileCommand(ctx, projectile, transform, gameId, ref traversibilityMap, ref projectileTraversibilityMap);
            DeleteProjectile(ctx, projectile.Id);
            return (true, projectile, transform);
        }

        DamageTerrainAtTile(ctx, gameId, projectileTileX, projectileTileY, tileIndex, projectile.Damage, ref traversibilityMap, ref projectileTraversibilityMap);

        DeleteProjectile(ctx, projectile.Id);
        return (true, projectile, transform);
    }

    private static (Module.Projectile projectile, Module.ProjectileTransform transform) DamageTerrainInRadius(
        ReducerContext ctx,
        Module.Projectile projectile,
        Module.ProjectileTransform transform,
        ref Module.TraversibilityMap traversibilityMap,
        ref Module.ProjectileTraversibilityMap projectileTraversibilityMap,
        string gameId)
    {
        int collisionTileRadius = (int)Math.Ceiling(projectile.CollisionRadius);
        int centerTileX = (int)transform.PositionX;
        int centerTileY = (int)transform.PositionY;

        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        ulong expirationThreshold = 500_000;
        float collisionRadiusSquared = projectile.CollisionRadius * projectile.CollisionRadius;

        DamagedTile[]? recentlyDamagedBuffer = null;
        int recentlyDamagedCount = 0;
        if (projectile.RecentlyDamagedTiles != null)
        {
            foreach (var damagedTile in projectile.RecentlyDamagedTiles)
            {
                if (currentTime - damagedTile.DamagedAt < expirationThreshold)
                {
                    recentlyDamagedBuffer ??= new DamagedTile[COLLISION_TRACKING_BUFFER_SIZE];
                    if (recentlyDamagedCount < recentlyDamagedBuffer.Length)
                    {
                        recentlyDamagedBuffer[recentlyDamagedCount++] = damagedTile;
                    }
                }
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

                float dx_tile = tileCenterX - transform.PositionX;
                float dy_tile = tileCenterY - transform.PositionY;
                float distanceSquared = dx_tile * dx_tile + dy_tile * dy_tile;

                if (distanceSquared <= collisionRadiusSquared)
                {
                    bool alreadyDamaged = false;
                    for (int i = 0; i < recentlyDamagedCount; i++)
                    {
                        if (recentlyDamagedBuffer![i].X == tileX && recentlyDamagedBuffer[i].Y == tileY)
                        {
                            alreadyDamaged = true;
                            break;
                        }
                    }

                    if (!alreadyDamaged)
                    {
                        int tileIndex = tileY * traversibilityMap.Width + tileX;
                        DamageTerrainAtTile(ctx, gameId, tileX, tileY, tileIndex, projectile.Damage, ref traversibilityMap, ref projectileTraversibilityMap);

                        recentlyDamagedBuffer ??= new DamagedTile[COLLISION_TRACKING_BUFFER_SIZE];
                        if (recentlyDamagedCount < recentlyDamagedBuffer.Length)
                        {
                            recentlyDamagedBuffer[recentlyDamagedCount++] = new DamagedTile
                            {
                                X = tileX,
                                Y = tileY,
                                DamagedAt = currentTime
                            };
                        }
                    }
                }
            }
        }

        projectile = projectile with
        {
            RecentlyDamagedTiles = recentlyDamagedCount > 0 ? recentlyDamagedBuffer!.AsSpan(0, recentlyDamagedCount).ToArray() : null
        };

        return (projectile, transform);
    }

    private static (Module.Projectile projectile, Module.ProjectileTransform transform) HandleProjectileBounce(Module.Projectile projectile, Module.ProjectileTransform transform, int projectileTileX, int projectileTileY, double deltaTime)
    {
        float previousX = transform.PositionX - transform.Velocity.X * (float)deltaTime;
        float previousY = transform.PositionY - transform.Velocity.Y * (float)deltaTime;

        int prevTileX = (int)previousX;
        int prevTileY = (int)previousY;

        bool bounceX = prevTileX != projectileTileX;
        bool bounceY = prevTileY != projectileTileY;

        float newVelX = transform.Velocity.X;
        float newVelY = transform.Velocity.Y;
        float newPosX = transform.PositionX;
        float newPosY = transform.PositionY;

        if (bounceX)
        {
            newVelX = -transform.Velocity.X;
            newPosX = previousX;
        }
        if (bounceY)
        {
            newVelY = -transform.Velocity.Y;
            newPosY = previousY;
        }

        return (projectile with { Speed = (float)Math.Sqrt(newVelX * newVelX + newVelY * newVelY) },
            transform with
            {
                PositionX = newPosX,
                PositionY = newPosY,
                Velocity = new Vector2Float(newVelX, newVelY)
            });
    }

    private static (int minRegionX, int maxRegionX, int minRegionY, int maxRegionY) CalculateTankCollisionRegions(Module.Projectile projectile, Module.ProjectileTransform transform)
    {
        int tankCollisionRegionX = (int)(transform.PositionX / Module.COLLISION_REGION_SIZE);
        int tankCollisionRegionY = (int)(transform.PositionY / Module.COLLISION_REGION_SIZE);

        float regionLocalX = transform.PositionX - (tankCollisionRegionX * Module.COLLISION_REGION_SIZE);
        float regionLocalY = transform.PositionY - (tankCollisionRegionY * Module.COLLISION_REGION_SIZE);

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

    private static bool HandleBoomerangReturn(ReducerContext ctx, Module.Projectile projectile, Module.Tank tank)
    {
        if (!projectile.ReturnsToShooter || !projectile.IsReturning || tank.Id != projectile.ShooterTankId)
        {
            return false;
        }

        Module.TankGun? existingBoomerang = null;
        int storedGunCount = 0;
        foreach (var g in ctx.Db.tank_gun.TankId.Filter(tank.Id))
        {
            storedGunCount++;
            if (g.Gun.GunType == GunType.Boomerang)
            {
                existingBoomerang = g;
            }
        }

        if (existingBoomerang != null)
        {
            var gun = existingBoomerang.Value.Gun;
            if (gun.Ammo != null)
            {
                gun.Ammo = gun.Ammo.Value + 1;
                ctx.Db.tank_gun.Id.Update(existingBoomerang.Value with { Gun = gun });
            }
        }
        else if (storedGunCount < 2)
        {
            var boomerangGun = Module.BOOMERANG_GUN with { Ammo = 1 };
            var newGunIndex = storedGunCount + 1;
            ctx.Db.tank_gun.Insert(new Module.TankGun
            {
                TankId = tank.Id,
                GameId = tank.GameId,
                SlotIndex = newGunIndex,
                Gun = boomerangGun
            });
            tank = tank with { SelectedGunIndex = newGunIndex };
            ctx.Db.tank.Id.Update(tank);
        }

        DeleteProjectile(ctx, projectile.Id);
        return true;
    }

    private static (bool collided, Module.Projectile projectile, Module.ProjectileTransform transform) HandleTankCollisions(
        ReducerContext ctx,
        Module.Projectile projectile,
        Module.ProjectileTransform transform,
        string gameId,
        ref Module.TraversibilityMap traversibilityMap,
        ref Module.ProjectileTraversibilityMap projectileTraversibilityMap,
        Dictionary<(int, int), List<(Module.Tank, Module.TankTransform)>> tanksByRegion,
        Dictionary<string, Module.Tank> tanksById,
        int minRegionX,
        int maxRegionX,
        int minRegionY,
        int maxRegionY)
    {
        float totalCollisionRadius = projectile.CollisionRadius + Module.TANK_COLLISION_RADIUS;
        float collisionRadiusSquared = totalCollisionRadius * totalCollisionRadius;

        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        ulong expirationThreshold = 500_000;

        DamagedTank[]? recentlyHitBuffer = null;
        int recentlyHitCount = 0;
        if (projectile.RecentlyHitTanks != null)
        {
            foreach (var hitTank in projectile.RecentlyHitTanks)
            {
                if (currentTime - hitTank.DamagedAt < expirationThreshold)
                {
                    recentlyHitBuffer ??= new DamagedTank[COLLISION_TRACKING_BUFFER_SIZE];
                    if (recentlyHitCount < recentlyHitBuffer.Length)
                    {
                        recentlyHitBuffer[recentlyHitCount++] = hitTank;
                    }
                }
            }
        }

        for (int regionX = minRegionX; regionX <= maxRegionX; regionX++)
        {
            if (regionX < 0) continue;

            for (int regionY = minRegionY; regionY <= maxRegionY; regionY++)
            {
                if (regionY < 0) continue;

                if (!tanksByRegion.TryGetValue((regionX, regionY), out var tanksInRegion))
                    continue;

                foreach (var (tank, tankTransform) in tanksInRegion)
                {
                    float dx = tankTransform.PositionX - transform.PositionX;
                    float dy = tankTransform.PositionY - transform.PositionY;
                    float distanceSquared = dx * dx + dy * dy;

                    if (distanceSquared <= collisionRadiusSquared)
                    {
                        var currentTank = tanksById.TryGetValue(tank.Id, out var updatedTank) ? updatedTank : tank;

                        if (HandleBoomerangReturn(ctx, projectile, currentTank))
                        {
                            return (true, projectile, transform);
                        }

                        if (currentTank.Alliance != projectile.Alliance && currentTank.Health > 0 && currentTank.RemainingImmunityMicros <= 0)
                        {
                            bool alreadyHit = false;
                            for (int i = 0; i < recentlyHitCount; i++)
                            {
                                if (recentlyHitBuffer![i].TankId == currentTank.Id)
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
                                        ProjectileUpdater.ExplodeProjectileCommand(ctx, projectile, transform, gameId, ref traversibilityMap, ref projectileTraversibilityMap);
                                        DeleteProjectile(ctx, projectile.Id);
                                        return (true, projectile, transform);
                                    }
                                }
                                else
                                {
                                    Module.DealDamageToTankCommand(ctx, currentTank, tankTransform, projectile.Damage, projectile.ShooterTankId, projectile.Alliance, gameId);
                                }

                                recentlyHitBuffer ??= new DamagedTank[COLLISION_TRACKING_BUFFER_SIZE];
                                if (recentlyHitCount < recentlyHitBuffer.Length)
                                {
                                    recentlyHitBuffer[recentlyHitCount++] = new DamagedTank
                                    {
                                        TankId = currentTank.Id,
                                        DamagedAt = currentTime
                                    };
                                }

                                bool shouldDelete;
                                (shouldDelete, transform) = Module.IncrementProjectileCollision(ctx, projectile, transform);

                                if (shouldDelete)
                                {
                                    return (true, projectile, transform);
                                }
                            }
                        }
                    }
                }
            }
        }

        projectile = projectile with
        {
            RecentlyHitTanks = recentlyHitCount > 0 ? recentlyHitBuffer!.AsSpan(0, recentlyHitCount).ToArray() : null
        };

        return (false, projectile, transform);
    }

    public static void DeleteProjectile(ReducerContext ctx, ulong projectileId)
    {
        ctx.Db.projectile.Id.Delete(projectileId);
        ctx.Db.projectile_transform.ProjectileId.Delete(projectileId);
    }

    [Reducer]
    public static void UpdateProjectiles(ReducerContext ctx, ScheduledProjectileUpdates args)
    {
        var currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var deltaTimeMicros = currentTime - args.LastTickAt;
        var deltaTime = deltaTimeMicros / 1_000_000.0;

        if (deltaTimeMicros > LATE_UPDATE_THRESHOLD_MICROS)
        {
            Log.Warn($"Projectile update significantly late: {deltaTimeMicros / 1000.0:F2}ms (expected ~{Module.NETWORK_TICK_RATE_MICROS / 1000.0:F2}ms, game: {args.GameId})");
        }

        var newTickCount = args.TickCount + 1;
        ctx.Db.ScheduledProjectileUpdates.ScheduledId.Update(args with
        {
            LastTickAt = currentTime,
            TickCount = newTickCount
        });

        var traversibilityMapQuery = ctx.Db.traversibility_map.GameId.Find(args.GameId);
        if (traversibilityMapQuery == null) return;
        var traversibilityMap = traversibilityMapQuery.Value;
        var initialTankMapVersion = traversibilityMap.Version;

        var projectileTraversibilityMapQuery = ctx.Db.projectile_traversibility_map.GameId.Find(args.GameId);
        if (projectileTraversibilityMapQuery == null) return;
        var projectileTraversibilityMap = projectileTraversibilityMapQuery.Value;
        var initialProjectileMapVersion = projectileTraversibilityMap.Version;

        var transforms = GetTransformCache();
        foreach (var t in ctx.Db.projectile_transform.GameId.Filter(args.GameId))
        {
            transforms[t.ProjectileId] = t;
        }

        var tanksByRegion = GetTanksByRegionCache();
        var tanksById = GetTanksByIdCache();
        BuildTankSpatialCache(ctx, args.GameId, tanksByRegion, tanksById);

        var projectiles = GetProjectileList();
        foreach (var p in ctx.Db.projectile.GameId.Filter(args.GameId))
        {
            projectiles.Add(p);
        }

        var projectilesProcessed = 0;
        var projectilesExpired = 0;
        var projectilesCollided = 0;

        foreach (var iProjectile in projectiles)
        {
            projectilesProcessed++;
            var projectile = iProjectile;

            if (!transforms.TryGetValue(projectile.Id, out var transform))
            {
                Log.Warn($"Orphaned projectile found without transform: {projectile.Id}");
                ctx.Db.projectile.Id.Delete(projectile.Id);
                continue;
            }

            var projectileAgeMicros = currentTime - projectile.SpawnedAt;
            var projectileAgeSeconds = projectileAgeMicros / 1_000_000.0;

            if (projectileAgeSeconds >= projectile.LifetimeSeconds)
            {
                projectilesExpired++;
                if (projectile.ExplosionTrigger == ExplosionTrigger.OnExpiration)
                {
                    ProjectileUpdater.ExplodeProjectileCommand(ctx, projectile, transform, args.GameId, ref traversibilityMap, ref projectileTraversibilityMap);
                }
                DeleteProjectile(ctx, projectile.Id);
                continue;
            }

            (projectile, transform) = UpdateBoomerangVelocity(projectile, transform, projectileAgeSeconds);

            transform = UpdateMissileTracking(projectile, transform, tanksByRegion, deltaTime);

            if (projectile.Damping != null && projectile.Damping > 0 && projectile.Damping < 1)
            {
                float dampingFactor = (float)Math.Pow(projectile.Damping.Value, deltaTime);
                transform = transform with
                {
                    Velocity = new Vector2Float(
                        transform.Velocity.X * dampingFactor,
                        transform.Velocity.Y * dampingFactor
                    )
                };
                projectile = projectile with { Speed = projectile.Speed * dampingFactor };
            }

            transform = transform with
            {
                PositionX = (float)(transform.PositionX + transform.Velocity.X * deltaTime),
                PositionY = (float)(transform.PositionY + transform.Velocity.Y * deltaTime)
            };

            bool collided;
            (collided, projectile, transform) = HandleTerrainCollision(ctx, projectile, transform, ref projectileTraversibilityMap, ref traversibilityMap, args.GameId, deltaTime);

            if (collided)
            {
                projectilesCollided++;
                continue;
            }

            var (minRegionX, maxRegionX, minRegionY, maxRegionY) = CalculateTankCollisionRegions(projectile, transform);

            (collided, projectile, transform) = HandleTankCollisions(ctx, projectile, transform, args.GameId, ref traversibilityMap, ref projectileTraversibilityMap, tanksByRegion, tanksById, minRegionX, maxRegionX, minRegionY, maxRegionY);

            if (collided)
            {
                projectilesCollided++;
                continue;
            }

            ctx.Db.projectile.Id.Update(projectile);
            ctx.Db.projectile_transform.ProjectileId.Update(transform);
        }

        if (traversibilityMap.Version != initialTankMapVersion)
        {
            ctx.Db.traversibility_map.GameId.Update(traversibilityMap);
        }

        if (projectileTraversibilityMap.Version != initialProjectileMapVersion)
        {
            ctx.Db.projectile_traversibility_map.GameId.Update(projectileTraversibilityMap);
        }

        if (newTickCount % 8 == 0)
        {
            GC.Collect();
        }
    }
}