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

    [Table(Scheduled = nameof(ResetWorld))]
    public partial struct ScheduledWorldReset
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        public string WorldId;
    }

    private static void ExplodeProjectile(ReducerContext ctx, Projectile projectile, string worldId)
    {
        if (projectile.ExplosionRadius == null || projectile.ExplosionRadius <= 0)
        {
            return;
        }

        float explosionRadius = projectile.ExplosionRadius.Value;
        int projectileCollisionRegionX = Module.GetGridPosition(projectile.PositionX / Module.COLLISION_REGION_SIZE);
        int projectileCollisionRegionY = Module.GetGridPosition(projectile.PositionY / Module.COLLISION_REGION_SIZE);

        int searchRadius = (int)Math.Ceiling(explosionRadius / Module.COLLISION_REGION_SIZE);

        for (int dx = -searchRadius; dx <= searchRadius; dx++)
        {
            for (int dy = -searchRadius; dy <= searchRadius; dy++)
            {
                int regionX = projectileCollisionRegionX + dx;
                int regionY = projectileCollisionRegionY + dy;

                foreach (var tank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((worldId, regionX, regionY)))
                {
                    if (tank.Health > 0)
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

        Log.Info($"Projectile exploded at ({projectile.PositionX}, {projectile.PositionY})");
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
            }

            var score = ctx.Db.score.WorldId.Find(worldId);
            if (score != null)
            {
                var updatedScore = score.Value;
                if (projectile.Alliance >= 0 && projectile.Alliance < updatedScore.Kills.Length)
                {
                    updatedScore.Kills[projectile.Alliance]++;
                    ctx.Db.score.WorldId.Update(updatedScore);

                    if (updatedScore.Kills[projectile.Alliance] >= Module.KILL_LIMIT)
                    {
                        var world = ctx.Db.world.Id.Find(worldId);
                        if (world != null && world.Value.GameState == GameState.Playing)
                        {
                            var updatedWorld = world.Value with { GameState = GameState.Results };
                            ctx.Db.world.Id.Update(updatedWorld);

                            ctx.Db.ScheduledWorldReset.Insert(new ScheduledWorldReset
                            {
                                ScheduledId = 0,
                                ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = Module.WORLD_RESET_DELAY_MICROS }),
                                WorldId = worldId
                            });

                            Log.Info($"Team {projectile.Alliance} reached {Module.KILL_LIMIT} kills! Game ending in 30 seconds...");
                        }
                    }
                }
            }
        }
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

        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(args.WorldId);
        if (traversibilityMap == null) return;

        foreach (var iProjectile in ctx.Db.projectile.WorldId.Filter(args.WorldId))
        {
            var projectile = iProjectile;

            var projectileAgeMicros = currentTime - projectile.SpawnedAt;
            var projectileAgeSeconds = projectileAgeMicros / 1_000_000.0;

            if (projectileAgeSeconds >= projectile.LifetimeSeconds)
            {
                if (projectile.ExplosionTrigger == ExplosionTrigger.OnExpiration)
                {
                    ExplodeProjectile(ctx, projectile, args.WorldId);
                }
                ctx.Db.projectile.Id.Delete(projectile.Id);
                continue;
            }

            if (projectile.ReturnsToShooter && !projectile.IsReturning && projectileAgeSeconds >= projectile.LifetimeSeconds / 2.0)
            {
                projectile = projectile with
                {
                    Velocity = new Vector2Float(-projectile.Velocity.X, -projectile.Velocity.Y),
                    IsReturning = true
                };
            }

            if (projectile.ReturnsToShooter)
            {
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

                projectile = projectile with
                {
                    Velocity = new Vector2Float(
                        (float)(Math.Cos(angle) * currentSpeed),
                        (float)(Math.Sin(angle) * currentSpeed)
                    )
                };
            }

            if (projectile.TrackingStrength > 0)
            {
                int projectileCollisionRegionX = Module.GetGridPosition(projectile.PositionX / Module.COLLISION_REGION_SIZE);
                int projectileCollisionRegionY = Module.GetGridPosition(projectile.PositionY / Module.COLLISION_REGION_SIZE);

                int searchRadius = (int)Math.Ceiling(Module.MISSILE_TRACKING_RADIUS / Module.COLLISION_REGION_SIZE);

                Module.Tank? closestTarget = null;
                float closestDistanceSquared = Module.MISSILE_TRACKING_RADIUS * Module.MISSILE_TRACKING_RADIUS;

                for (int dx = -searchRadius; dx <= searchRadius; dx++)
                {
                    for (int dy = -searchRadius; dy <= searchRadius; dy++)
                    {
                        int regionX = projectileCollisionRegionX + dx;
                        int regionY = projectileCollisionRegionY + dy;

                        foreach (var tank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((args.WorldId, regionX, regionY)))
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

                if (closestTarget != null)
                {
                    var dx = closestTarget.Value.PositionX - projectile.PositionX;
                    var dy = closestTarget.Value.PositionY - projectile.PositionY;
                    var targetAngle = Math.Atan2(dy, dx);

                    var currentAngle = Math.Atan2(projectile.Velocity.Y, projectile.Velocity.X);
                    var angleDiff = targetAngle - currentAngle;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                    var turnAmount = Math.Sign(angleDiff) * Math.Min(Math.Abs(angleDiff), projectile.TrackingStrength * deltaTime);
                    var newAngle = currentAngle + turnAmount;

                    projectile = projectile with
                    {
                        Velocity = new Vector2Float(
                            (float)(Math.Cos(newAngle) * projectile.Speed),
                            (float)(Math.Sin(newAngle) * projectile.Speed)
                        )
                    };
                }
            }

            projectile = projectile with
            {
                PositionX = (float)(projectile.PositionX + projectile.Velocity.X * deltaTime),
                PositionY = (float)(projectile.PositionY + projectile.Velocity.Y * deltaTime)
            };

            int projectileTileX = Module.GetGridPosition(projectile.PositionX);
            int projectileTileY = Module.GetGridPosition(projectile.PositionY);

            bool collided = false;

            if (projectileTileX >= 0 && projectileTileX < traversibilityMap.Value.Width &&
                projectileTileY >= 0 && projectileTileY < traversibilityMap.Value.Height)
            {
                int tileIndex = projectileTileY * traversibilityMap.Value.Width + projectileTileX;
                bool tileIsTraversable = tileIndex < traversibilityMap.Value.Map.Length && traversibilityMap.Value.Map[tileIndex];

                if (!tileIsTraversable && !projectile.PassThroughTerrain)
                {
                    if (projectile.BounceDamping != null && projectile.BounceDamping > 0)
                    {
                        float previousX = projectile.PositionX - projectile.Velocity.X * (float)deltaTime;
                        float previousY = projectile.PositionY - projectile.Velocity.Y * (float)deltaTime;
                        
                        int prevTileX = Module.GetGridPosition(previousX);
                        int prevTileY = Module.GetGridPosition(previousY);
                        
                        bool bounceX = prevTileX != projectileTileX;
                        bool bounceY = prevTileY != projectileTileY;
                        
                        float newVelX = projectile.Velocity.X;
                        float newVelY = projectile.Velocity.Y;
                        float newPosX = projectile.PositionX;
                        float newPosY = projectile.PositionY;
                        
                        if (bounceX)
                        {
                            newVelX = -projectile.Velocity.X * projectile.BounceDamping.Value;
                            newPosX = previousX;
                        }
                        if (bounceY)
                        {
                            newVelY = -projectile.Velocity.Y * projectile.BounceDamping.Value;
                            newPosY = previousY;
                        }
                        
                        projectile = projectile with
                        {
                            PositionX = newPosX,
                            PositionY = newPosY,
                            Velocity = new Vector2Float(newVelX, newVelY),
                            Speed = (float)Math.Sqrt(newVelX * newVelX + newVelY * newVelY)
                        };
                    }
                    else
                    {
                        foreach (var terrainDetail in ctx.Db.terrain_detail.WorldId_PositionX_PositionY.Filter((args.WorldId, projectileTileX, projectileTileY)))
                        {
                            if (terrainDetail.Health == null)
                            {
                                continue;
                            }

                            var newHealth = terrainDetail.Health.Value - projectile.Damage;
                            if (newHealth <= 0)
                            {
                                ctx.Db.terrain_detail.Id.Delete(terrainDetail.Id);

                                traversibilityMap.Value.Map[tileIndex] = true;
                                ctx.Db.traversibility_map.WorldId.Update(traversibilityMap.Value);
                            }
                            else
                            {
                                ctx.Db.terrain_detail.Id.Update(terrainDetail with
                                {
                                    Health = newHealth
                                });
                            }

                            ctx.Db.projectile.Id.Delete(projectile.Id);
                            collided = true;
                            break;
                        }
                    }

                    if (collided) continue;
                }
            }

            int tankCollisionRegionX = Module.GetGridPosition(projectile.PositionX / Module.COLLISION_REGION_SIZE);
            int tankCollisionRegionY = Module.GetGridPosition(projectile.PositionY / Module.COLLISION_REGION_SIZE);

            foreach (var tank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((args.WorldId, tankCollisionRegionX, tankCollisionRegionY)))
            {
                float dx = tank.PositionX - projectile.PositionX;
                float dy = tank.PositionY - projectile.PositionY;
                float distanceSquared = dx * dx + dy * dy;
                float collisionRadiusSquared = Module.TANK_COLLISION_RADIUS * Module.TANK_COLLISION_RADIUS;

                if (distanceSquared <= collisionRadiusSquared)
                {
                    if (projectile.ReturnsToShooter && projectile.IsReturning && tank.Id == projectile.ShooterTankId)
                    {
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
                        collided = true;
                        break;
                    }

                    if (tank.Alliance != projectile.Alliance && tank.Health > 0)
                    {
                        if (projectile.ExplosionRadius != null && projectile.ExplosionRadius > 0)
                        {
                            if (projectile.ExplosionTrigger == ExplosionTrigger.OnHit)
                            {
                                ExplodeProjectile(ctx, projectile, args.WorldId);
                                ctx.Db.projectile.Id.Delete(projectile.Id);
                                collided = true;
                                break;
                            }
                        }
                        else
                        {
                            HandleTankDamage(ctx, tank, projectile, args.WorldId);
                        }

                        projectile = projectile with
                        {
                            CollisionCount = projectile.CollisionCount + 1
                        };

                        if (projectile.CollisionCount >= projectile.MaxCollisions)
                        {
                            ctx.Db.projectile.Id.Delete(projectile.Id);
                            collided = true;
                            break;
                        }
                    }
                }
            }

            if (!collided)
            {
                ctx.Db.projectile.Id.Update(projectile);
            }
        }
    }

    [Reducer]
    public static void ResetWorld(ReducerContext ctx, ScheduledWorldReset args)
    {
        var world = ctx.Db.world.Id.Find(args.WorldId);
        if (world == null) return;

        Log.Info($"Resetting world {args.WorldId}...");

        var (baseTerrain, terrainDetails) = TerrainGenerator.GenerateTerrain(ctx.Rng);
        var terrainDetailArray = TerrainGenerator.ConvertToArray(
            terrainDetails,
            TerrainGenerator.GetWorldWidth(),
            TerrainGenerator.GetWorldHeight()
        );
        var traversibilityMap = TerrainGenerator.CalculateTraversibility(baseTerrain, terrainDetailArray);

        var updatedWorld = world.Value with
        {
            BaseTerrainLayer = baseTerrain,
            GameState = GameState.Playing
        };
        ctx.Db.world.Id.Update(updatedWorld);

        foreach (var existingDetail in ctx.Db.terrain_detail.WorldId.Filter(args.WorldId))
        {
            ctx.Db.terrain_detail.Id.Delete(existingDetail.Id);
        }

        foreach (var detail in terrainDetails)
        {
            var terrainDetailId = Module.GenerateId(ctx, "td");
            ctx.Db.terrain_detail.Insert(new Module.TerrainDetail
            {
                Id = terrainDetailId,
                WorldId = args.WorldId,
                PositionX = detail.x,
                PositionY = detail.y,
                Type = detail.type,
                Health = 100,
                Label = null
            });
        }

        var existingTraversibilityMap = ctx.Db.traversibility_map.WorldId.Find(args.WorldId);
        if (existingTraversibilityMap != null)
        {
            ctx.Db.traversibility_map.WorldId.Update(new Module.TraversibilityMap
            {
                WorldId = args.WorldId,
                Map = traversibilityMap,
                Width = TerrainGenerator.GetWorldWidth(),
                Height = TerrainGenerator.GetWorldHeight()
            });
        }
        else
        {
            ctx.Db.traversibility_map.Insert(new Module.TraversibilityMap
            {
                WorldId = args.WorldId,
                Map = traversibilityMap,
                Width = TerrainGenerator.GetWorldWidth(),
                Height = TerrainGenerator.GetWorldHeight()
            });
        }

        var score = ctx.Db.score.WorldId.Find(args.WorldId);
        if (score != null)
        {
            var resetScore = score.Value with
            {
                Kills = new int[] { 0, 0 }
            };
            ctx.Db.score.WorldId.Update(resetScore);
        }

        var tanks = new List<Module.Tank>();
        foreach (var tank in ctx.Db.tank.WorldId.Filter(args.WorldId))
        {
            tanks.Add(tank);
        }

        int totalTanks = tanks.Count;
        var shuffledIndices = new int[totalTanks];
        for (int i = 0; i < totalTanks; i++)
        {
            shuffledIndices[i] = i;
        }

        for (int i = totalTanks - 1; i > 0; i--)
        {
            int j = ctx.Rng.Next(i + 1);
            int temp = shuffledIndices[i];
            shuffledIndices[i] = shuffledIndices[j];
            shuffledIndices[j] = temp;
        }

        for (int i = 0; i < totalTanks; i++)
        {
            int tankIndex = shuffledIndices[i];
            var tank = tanks[tankIndex];

            int newAlliance = i < (totalTanks + 1) / 2 ? 0 : 1;

            var resetTank = Module.RespawnTank(ctx, tank, args.WorldId, newAlliance, resetKills: true);

            ctx.Db.tank.Id.Update(resetTank);
        }

        foreach (var projectile in ctx.Db.projectile.WorldId.Filter(args.WorldId))
        {
            ctx.Db.projectile.Id.Delete(projectile.Id);
        }

        var existingPickupSpawner = ctx.Db.ScheduledPickupSpawn.WorldId.Filter(args.WorldId);
        bool hasPickupSpawner = false;
        foreach (var spawner in existingPickupSpawner)
        {
            hasPickupSpawner = true;
            break;
        }
        if (!hasPickupSpawner)
        {
            Module.InitializePickupSpawner(ctx, args.WorldId, 5);
        }

        Log.Info($"World {args.WorldId} reset complete. Teams randomized, {totalTanks} tanks respawned.");
    }

    [Reducer]
    public static void FireChargedWeapon(ReducerContext ctx, Module.ScheduledChargedWeaponFire args)
    {
        Tank? maybeTank = ctx.Db.tank.Id.Find(args.TankId);
        if (maybeTank == null) return;

        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        if (args.SelectedGunIndex < 0 || args.SelectedGunIndex >= tank.Guns.Length) return;

        var gun = tank.Guns[args.SelectedGunIndex];

        if (gun.Ammo != null && gun.Ammo <= 0) return;

        float barrelTipX = tank.PositionX + (float)Math.Cos(args.TurretRotation) * Module.GUN_BARREL_LENGTH;
        float barrelTipY = tank.PositionY + (float)Math.Sin(args.TurretRotation) * Module.GUN_BARREL_LENGTH;

        if (gun.RaycastRange != null)
        {
            float raycastRange = gun.RaycastRange.Value;

            float dirX = (float)Math.Cos(args.TurretRotation);
            float dirY = (float)Math.Sin(args.TurretRotation);

            var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(tank.WorldId);
            if (traversibilityMap == null) return;

            float hitDistance = raycastRange;
            Module.Tank? hitTank = null;

            float stepSize = 0.1f;
            for (float distance = 0; distance < raycastRange; distance += stepSize)
            {
                float checkX = barrelTipX + dirX * distance;
                float checkY = barrelTipY + dirY * distance;

                int tileX = Module.GetGridPosition(checkX);
                int tileY = Module.GetGridPosition(checkY);

                if (tileX >= 0 && tileX < traversibilityMap.Value.Width &&
                    tileY >= 0 && tileY < traversibilityMap.Value.Height)
                {
                    int tileIndex = tileY * traversibilityMap.Value.Width + tileX;
                    bool tileIsTraversable = tileIndex < traversibilityMap.Value.Map.Length && traversibilityMap.Value.Map[tileIndex];

                    if (!tileIsTraversable)
                    {
                        hitDistance = distance;
                        break;
                    }
                }

                int collisionRegionX = Module.GetGridPosition(checkX / Module.COLLISION_REGION_SIZE);
                int collisionRegionY = Module.GetGridPosition(checkY / Module.COLLISION_REGION_SIZE);

                foreach (var targetTank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((tank.WorldId, collisionRegionX, collisionRegionY)))
                {
                    if (targetTank.Alliance != tank.Alliance && targetTank.Health > 0)
                    {
                        float dx = targetTank.PositionX - checkX;
                        float dy = targetTank.PositionY - checkY;
                        float distanceSquared = dx * dx + dy * dy;
                        float collisionRadiusSquared = Module.TANK_COLLISION_RADIUS * Module.TANK_COLLISION_RADIUS;

                        if (distanceSquared <= collisionRadiusSquared)
                        {
                            hitDistance = distance;
                            hitTank = targetTank;
                            break;
                        }
                    }
                }

                if (hitTank != null)
                {
                    break;
                }
            }

            if (hitTank != null)
            {
                var newHealth = hitTank.Value.Health - gun.Damage;
                var updatedTank = hitTank.Value with
                {
                    Health = newHealth
                };
                ctx.Db.tank.Id.Update(updatedTank);

                if (newHealth <= 0)
                {
                    var updatedShooterTank = tank with
                    {
                        Kills = tank.Kills + 1
                    };
                    ctx.Db.tank.Id.Update(updatedShooterTank);

                    var score = ctx.Db.score.WorldId.Find(tank.WorldId);
                    if (score != null)
                    {
                        var updatedScore = score.Value;
                        if (tank.Alliance >= 0 && tank.Alliance < updatedScore.Kills.Length)
                        {
                            updatedScore.Kills[tank.Alliance]++;
                            ctx.Db.score.WorldId.Update(updatedScore);

                            if (updatedScore.Kills[tank.Alliance] >= Module.KILL_LIMIT)
                            {
                                var world = ctx.Db.world.Id.Find(tank.WorldId);
                                if (world != null && world.Value.GameState == GameState.Playing)
                                {
                                    var updatedWorld = world.Value with { GameState = GameState.Results };
                                    ctx.Db.world.Id.Update(updatedWorld);

                                    ctx.Db.ScheduledWorldReset.Insert(new ScheduledWorldReset
                                    {
                                        ScheduledId = 0,
                                        ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = Module.WORLD_RESET_DELAY_MICROS }),
                                        WorldId = tank.WorldId
                                    });

                                    Log.Info($"Team {tank.Alliance} reached {Module.KILL_LIMIT} kills! Game ending in 30 seconds...");
                                }
                            }
                        }
                    }
                }

                Log.Info($"Raycast weapon hit {hitTank.Value.Name} for {gun.Damage} damage at distance {hitDistance}");
            }
            else
            {
                Log.Info($"Raycast weapon missed, traveled {hitDistance} units");
            }
        }
        else
        {
            if (gun.ProjectileCount == 1)
            {
                Module.CreateProjectile(ctx, tank, barrelTipX, barrelTipY, args.TurretRotation, gun);
            }
            else
            {
                float halfSpread = gun.SpreadAngle * (gun.ProjectileCount - 1) / 2.0f;
                for (int i = 0; i < gun.ProjectileCount; i++)
                {
                    float angle = args.TurretRotation - halfSpread + (i * gun.SpreadAngle);
                    Module.CreateProjectile(ctx, tank, barrelTipX, barrelTipY, angle, gun);
                }
            }

            Log.Info($"Tank {tank.Name} fired charged {gun.GunType}");
        }

        if (gun.Ammo != null)
        {
            var newAmmo = gun.Ammo.Value - 1;

            if (newAmmo <= 0)
            {
                tank.Guns = tank.Guns.Where((_, index) => index != args.SelectedGunIndex).ToArray();
                if (tank.Guns.Length > 0)
                {
                    tank.SelectedGunIndex = 0;
                }
                else
                {
                    tank.SelectedGunIndex = -1;
                }
            }
            else
            {
                gun.Ammo = newAmmo;
                var updatedGuns = tank.Guns.ToArray();
                updatedGuns[args.SelectedGunIndex] = gun;
                tank.Guns = updatedGuns;
            }

            ctx.Db.tank.Id.Update(tank);
        }

        Log.Info($"Tank {tank.Name} fired weapon. Ammo remaining: {gun.Ammo?.ToString() ?? "unlimited"}");
    }
}
