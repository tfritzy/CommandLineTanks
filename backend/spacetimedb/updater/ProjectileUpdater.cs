using SpacetimeDB;
using static Types;
using System.Collections.Generic;
using static Module;

public static partial class ProjectileUpdater
{
    public class ProjectileUpdateContext
    {
        private ReducerContext _ctx;
        private string _gameId;
        private Dictionary<string, Module.Tank?> _tanksById;
        private Dictionary<(int regionX, int regionY), List<Module.TankTransform>> _tankTransformsByRegion;
        private Dictionary<(int gridX, int gridY), Module.TerrainDetail?> _terrainDetailByPosition;
        private List<List<Module.TankTransform>> _transformListPool;
        public ulong CurrentTime;

        public ProjectileUpdateContext(ReducerContext ctx, string gameId, ulong currentTime)
        {
            _ctx = ctx;
            _gameId = gameId;
            CurrentTime = currentTime;
            _tanksById = new Dictionary<string, Module.Tank?>();
            _tankTransformsByRegion = new Dictionary<(int, int), List<Module.TankTransform>>();
            _terrainDetailByPosition = new Dictionary<(int, int), Module.TerrainDetail?>();
            _transformListPool = new List<List<Module.TankTransform>>();
        }

        public void Reset(ReducerContext ctx, string gameId, ulong currentTime)
        {
            _ctx = ctx;
            _gameId = gameId;
            CurrentTime = currentTime;
            _tanksById.Clear();
            foreach (var kvp in _tankTransformsByRegion)
            {
                kvp.Value.Clear();
                _transformListPool.Add(kvp.Value);
            }
            _tankTransformsByRegion.Clear();
            _terrainDetailByPosition.Clear();
        }

        private List<Module.TankTransform> GetPooledTransformList()
        {
            if (_transformListPool.Count > 0)
            {
                var list = _transformListPool[_transformListPool.Count - 1];
                _transformListPool.RemoveAt(_transformListPool.Count - 1);
                return list;
            }
            return new List<Module.TankTransform>();
        }

        public Module.Tank? GetTankById(string tankId)
        {
            if (!_tanksById.TryGetValue(tankId, out var tank))
            {
                tank = _ctx.Db.tank.Id.Find(tankId);
                _tanksById[tankId] = tank;
            }

            return tank;
        }

        public List<Module.TankTransform> GetTankTransformsByRegion(int regionX, int regionY)
        {
            var key = (regionX, regionY);
            if (!_tankTransformsByRegion.TryGetValue(key, out var transforms))
            {
                transforms = GetPooledTransformList();
                foreach (var transform in _ctx.Db.tank_transform.GameId_CollisionRegionX_CollisionRegionY.Filter((_gameId, regionX, regionY)))
                {
                    transforms.Add(transform);
                }
                _tankTransformsByRegion[key] = transforms;
            }

            return transforms;
        }

        public Module.TerrainDetail? GetTerrainDetailAt(int gridX, int gridY)
        {
            var key = (gridX, gridY);
            if (!_terrainDetailByPosition.TryGetValue(key, out var detail))
            {
                detail = null;
                foreach (var terrainDetail in _ctx.Db.terrain_detail.GameId_GridX_GridY.Filter((_gameId, gridX, gridY)))
                {
                    detail = terrainDetail;
                    break;
                }
                _terrainDetailByPosition[key] = detail;
            }

            return detail;
        }

        public void UpdateTerrainDetail(Module.TerrainDetail detail)
        {
            var key = (detail.GridX, detail.GridY);
            _terrainDetailByPosition[key] = detail;
            _ctx.Db.terrain_detail.Id.Update(detail);
        }

        public void DeleteTerrainDetail(Module.TerrainDetail detail)
        {
            var key = (detail.GridX, detail.GridY);
            _terrainDetailByPosition[key] = null;
            _ctx.Db.terrain_detail.Id.Delete(detail.Id);
        }
    }

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

    private static Module.ProjectileTransform UpdateMissileTracking(ReducerContext ctx, ProjectileUpdateContext updateContext, Module.Projectile projectile, Module.ProjectileTransform transform, string gameId, double deltaTime)
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

                var tankTransforms = updateContext.GetTankTransformsByRegion(regionX, regionY);
                foreach (var tankTransform in tankTransforms)
                {
                    var tank = updateContext.GetTankById(tankTransform.TankId);
                    if (tank == null) continue;

                    if (tank.Value.Alliance != projectile.Alliance && tank.Value.Health > 0)
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

    private static (bool collided, Module.Projectile projectile, Module.ProjectileTransform transform, bool mapChanged) HandleTerrainCollision(
        ReducerContext ctx,
        ProjectileUpdateContext updateContext,
        Module.Projectile projectile,
        Module.ProjectileTransform transform,
        ref Module.TraversibilityMap traversibilityMap,
        string gameId,
        double deltaTime)
    {
        int projectileTileX = (int)transform.PositionX;
        int projectileTileY = (int)transform.PositionY;

        if (projectileTileX < 0 || projectileTileX >= traversibilityMap.Width ||
            projectileTileY < 0 || projectileTileY >= traversibilityMap.Height)
        {
            return (false, projectile, transform, false);
        }

        int tileIndex = projectileTileY * traversibilityMap.Width + projectileTileX;
        bool tileIsTraversable = tileIndex < traversibilityMap.Map.Length && traversibilityMap.Map[tileIndex];

        if (projectile.PassThroughTerrain)
        {
            if (projectile.CollisionRadius > 0)
            {
                bool terrainChanged;
                (projectile, transform, terrainChanged) = DamageTerrainInRadius(ctx, updateContext, projectile, transform, ref traversibilityMap, gameId);
                return (false, projectile, transform, terrainChanged);
            }
            return (false, projectile, transform, false);
        }

        if (tileIsTraversable)
        {
            return (false, projectile, transform, false);
        }

        if (projectile.Bounce)
        {
            (projectile, transform) = HandleProjectileBounce(projectile, transform, projectileTileX, projectileTileY, deltaTime);
            return (false, projectile, transform, false);
        }

        if (projectile.ExplosionRadius != null && projectile.ExplosionRadius > 0 && projectile.ExplosionTrigger == ExplosionTrigger.OnHit)
        {
            bool mapChanged = ExplodeProjectileCommand(ctx, updateContext, projectile, transform, gameId, ref traversibilityMap);
            DeleteProjectile(ctx, projectile.Id);
            return (true, projectile, transform, mapChanged);
        }

        bool terrainDamageMapChanged = DamageTerrainAtTile(ctx, updateContext, gameId, projectileTileX, projectileTileY, tileIndex, projectile.Damage, ref traversibilityMap);

        DeleteProjectile(ctx, projectile.Id);
        return (true, projectile, transform, terrainDamageMapChanged);
    }

    private static (Module.Projectile projectile, Module.ProjectileTransform transform, bool mapChanged) DamageTerrainInRadius(
        ReducerContext ctx,
        ProjectileUpdateContext updateContext,
        Module.Projectile projectile,
        Module.ProjectileTransform transform,
        ref Module.TraversibilityMap traversibilityMap,
        string gameId)
    {
        int collisionTileRadius = (int)Math.Ceiling(projectile.CollisionRadius);
        int centerTileX = (int)transform.PositionX;
        int centerTileY = (int)transform.PositionY;

        bool traversibilityMapChanged = false;
        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        ulong expirationThreshold = 500_000;
        float collisionRadiusSquared = projectile.CollisionRadius * projectile.CollisionRadius;

        int validCount = 0;
        var existingTiles = projectile.RecentlyDamagedTiles;
        for (int i = 0; i < existingTiles.Length; i++)
        {
            if (currentTime - existingTiles[i].DamagedAt < expirationThreshold)
            {
                if (validCount != i)
                {
                    existingTiles[validCount] = existingTiles[i];
                }
                validCount++;
            }
        }

        int newTilesCount = 0;
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
                    for (int i = 0; i < validCount; i++)
                    {
                        if (existingTiles[i].X == tileX && existingTiles[i].Y == tileY)
                        {
                            alreadyDamaged = true;
                            break;
                        }
                    }

                    if (!alreadyDamaged)
                    {
                        int tileIndex = tileY * traversibilityMap.Width + tileX;
                        if (DamageTerrainAtTile(ctx, updateContext, gameId, tileX, tileY, tileIndex, projectile.Damage, ref traversibilityMap))
                        {
                            traversibilityMapChanged = true;
                        }
                        newTilesCount++;
                    }
                }
            }
        }

        DamagedTile[] finalTiles;
        if (newTilesCount == 0 && validCount == existingTiles.Length)
        {
            finalTiles = existingTiles;
        }
        else
        {
            finalTiles = new DamagedTile[validCount + newTilesCount];
            for (int i = 0; i < validCount; i++)
            {
                finalTiles[i] = existingTiles[i];
            }

            int newIndex = validCount;
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
                        for (int i = 0; i < validCount; i++)
                        {
                            if (finalTiles[i].X == tileX && finalTiles[i].Y == tileY)
                            {
                                alreadyDamaged = true;
                                break;
                            }
                        }

                        if (!alreadyDamaged)
                        {
                            finalTiles[newIndex++] = new DamagedTile
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
            RecentlyDamagedTiles = finalTiles
        };

        return (projectile, transform, traversibilityMapChanged);
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
        }

        DeleteProjectile(ctx, projectile.Id);
        return true;
    }

    private static (bool collided, Module.Projectile projectile, Module.ProjectileTransform transform, bool mapChanged) HandleTankCollisions(
        ReducerContext ctx,
        ProjectileUpdateContext updateContext,
        Module.Projectile projectile,
        Module.ProjectileTransform transform,
        string gameId,
        ref Module.TraversibilityMap traversibilityMap,
        int minRegionX,
        int maxRegionX,
        int minRegionY,
        int maxRegionY)
    {
        float totalCollisionRadius = projectile.CollisionRadius + Module.TANK_COLLISION_RADIUS;
        float collisionRadiusSquared = totalCollisionRadius * totalCollisionRadius;

        ulong currentTime = updateContext.CurrentTime;
        ulong expirationThreshold = 500_000;

        var existingHits = projectile.RecentlyHitTanks;
        int validCount = 0;
        for (int i = 0; i < existingHits.Length; i++)
        {
            if (currentTime - existingHits[i].DamagedAt < expirationThreshold)
            {
                if (validCount != i)
                {
                    existingHits[validCount] = existingHits[i];
                }
                validCount++;
            }
        }

        var newHits = new DamagedTank[8];
        int newHitCount = 0;

        for (int regionX = minRegionX; regionX <= maxRegionX; regionX++)
        {
            if (regionX < 0) continue;

            for (int regionY = minRegionY; regionY <= maxRegionY; regionY++)
            {
                if (regionY < 0) continue;

                var tankTransforms = updateContext.GetTankTransformsByRegion(regionX, regionY);
                foreach (var tankTransform in tankTransforms)
                {
                    float dx = tankTransform.PositionX - transform.PositionX;
                    float dy = tankTransform.PositionY - transform.PositionY;
                    float distanceSquared = dx * dx + dy * dy;

                    if (distanceSquared <= collisionRadiusSquared)
                    {
                        var tankQuery = updateContext.GetTankById(tankTransform.TankId);
                        if (tankQuery == null) continue;
                        var tank = tankQuery.Value;

                        if (HandleBoomerangReturn(ctx, projectile, tank))
                        {
                            return (true, projectile, transform, false);
                        }

                        if (tank.Alliance != projectile.Alliance && tank.Health > 0 && tank.RemainingImmunityMicros <= 0)
                        {
                            bool alreadyHit = false;
                            for (int i = 0; i < validCount; i++)
                            {
                                if (existingHits[i].TankId == tank.Id)
                                {
                                    alreadyHit = true;
                                    break;
                                }
                            }
                            if (!alreadyHit)
                            {
                                for (int i = 0; i < newHitCount; i++)
                                {
                                    if (newHits[i].TankId == tank.Id)
                                    {
                                        alreadyHit = true;
                                        break;
                                    }
                                }
                            }

                            if (!alreadyHit)
                            {
                                if (projectile.ExplosionRadius != null && projectile.ExplosionRadius > 0)
                                {
                                    if (projectile.ExplosionTrigger == ExplosionTrigger.OnHit)
                                    {
                                        bool mapChanged = ProjectileUpdater.ExplodeProjectileCommand(ctx, updateContext, projectile, transform, gameId, ref traversibilityMap);
                                        DeleteProjectile(ctx, projectile.Id);
                                        return (true, projectile, transform, mapChanged);
                                    }
                                }
                                else
                                {
                                    Module.DealDamageToTankCommand(ctx, tank, tankTransform, projectile.Damage, projectile.ShooterTankId, projectile.Alliance, gameId);
                                }

                                if (newHitCount >= newHits.Length)
                                {
                                    var largerArray = new DamagedTank[newHits.Length * 2];
                                    Array.Copy(newHits, largerArray, newHits.Length);
                                    newHits = largerArray;
                                }
                                newHits[newHitCount++] = new DamagedTank
                                {
                                    TankId = tank.Id,
                                    DamagedAt = currentTime
                                };

                                bool shouldDelete;
                                (shouldDelete, transform) = Module.IncrementProjectileCollision(ctx, projectile, transform);

                                if (shouldDelete)
                                {
                                    return (true, projectile, transform, false);
                                }
                            }
                        }
                    }
                }
            }
        }

        DamagedTank[] finalHits;
        if (newHitCount == 0 && validCount == existingHits.Length)
        {
            finalHits = existingHits;
        }
        else
        {
            finalHits = new DamagedTank[validCount + newHitCount];
            for (int i = 0; i < validCount; i++)
            {
                finalHits[i] = existingHits[i];
            }
            for (int i = 0; i < newHitCount; i++)
            {
                finalHits[validCount + i] = newHits[i];
            }
        }

        projectile = projectile with
        {
            RecentlyHitTanks = finalHits
        };

        return (false, projectile, transform, false);
    }

    private static void DeleteProjectile(ReducerContext ctx, ulong projectileId)
    {
        ctx.Db.projectile.Id.Delete(projectileId);
        ctx.Db.projectile_transform.ProjectileId.Delete(projectileId);
    }

    [Reducer]
    public static void UpdateProjectiles(ReducerContext ctx, ScheduledProjectileUpdates args)
    {
        var stopwatch = new LogStopwatch("update projectiles");
        var currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var deltaTimeMicros = currentTime - args.LastTickAt;
        var deltaTime = deltaTimeMicros / 1_000_000.0;

        ctx.Db.ScheduledProjectileUpdates.ScheduledId.Update(args with
        {
            LastTickAt = currentTime
        });

        var traversibilityMapQuery = ctx.Db.traversibility_map.GameId.Find(args.GameId);
        if (traversibilityMapQuery == null) return;
        var traversibilityMap = traversibilityMapQuery.Value;

        bool traversibilityMapChanged = false;

        var updateContext = ContextPools.GetProjectileContext(ctx, args.GameId, currentTime);

        foreach (var iProjectile in ctx.Db.projectile.GameId.Filter(args.GameId))
        {
            var projectile = iProjectile;

            var transformQuery = ctx.Db.projectile_transform.ProjectileId.Find(projectile.Id);
            if (transformQuery == null)
            {
                Log.Warn($"Orphaned projectile found without transform: {projectile.Id}");
                ctx.Db.projectile.Id.Delete(projectile.Id);
                continue;
            }
            var transform = transformQuery.Value;

            var projectileAgeMicros = currentTime - projectile.SpawnedAt;
            var projectileAgeSeconds = projectileAgeMicros / 1_000_000.0;

            if (projectileAgeSeconds >= projectile.LifetimeSeconds)
            {
                if (projectile.ExplosionTrigger == ExplosionTrigger.OnExpiration)
                {
                    if (ProjectileUpdater.ExplodeProjectileCommand(ctx, updateContext, projectile, transform, args.GameId, ref traversibilityMap))
                    {
                        traversibilityMapChanged = true;
                    }
                }
                DeleteProjectile(ctx, projectile.Id);
                continue;
            }

            (projectile, transform) = UpdateBoomerangVelocity(projectile, transform, projectileAgeSeconds);

            transform = UpdateMissileTracking(ctx, updateContext, projectile, transform, args.GameId, deltaTime);

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
            bool mapChanged;
            (collided, projectile, transform, mapChanged) = HandleTerrainCollision(ctx, updateContext, projectile, transform, ref traversibilityMap, args.GameId, deltaTime);

            if (mapChanged)
            {
                traversibilityMapChanged = true;
            }

            if (collided) continue;

            var (minRegionX, maxRegionX, minRegionY, maxRegionY) = CalculateTankCollisionRegions(projectile, transform);

            (collided, projectile, transform, mapChanged) = HandleTankCollisions(ctx, updateContext, projectile, transform, args.GameId, ref traversibilityMap, minRegionX, maxRegionX, minRegionY, maxRegionY);

            if (mapChanged)
            {
                traversibilityMapChanged = true;
            }

            if (collided) continue;

            ctx.Db.projectile.Id.Update(projectile);
            ctx.Db.projectile_transform.ProjectileId.Update(transform);
        }

        if (traversibilityMapChanged)
        {
            ctx.Db.traversibility_map.GameId.Update(traversibilityMap);
        }

        stopwatch.End();
    }
}
