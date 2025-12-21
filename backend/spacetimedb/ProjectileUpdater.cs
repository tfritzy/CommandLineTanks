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
            int tankX = Module.GetGridPosition(tank.PositionX);
            int tankY = Module.GetGridPosition(tank.PositionY);

            var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(worldId);
            if (traversibilityMap != null)
            {
                int tileIndex = tankY * traversibilityMap.Value.Width + tankX;
                if (tileIndex >= 0 && tileIndex < traversibilityMap.Value.Map.Length)
                {
                    traversibilityMap.Value.Map[tileIndex] = false;
                    ctx.Db.traversibility_map.WorldId.Update(traversibilityMap.Value);
                }
            }

            var deadTankId = Module.GenerateId(ctx, "td");
            ctx.Db.terrain_detail.Insert(new Module.TerrainDetail
            {
                Id = deadTankId,
                WorldId = worldId,
                PositionX = tank.PositionX,
                PositionY = tank.PositionY,
                Type = TerrainDetailType.DeadTank,
                Health = 50,
                Label = null,
                Rotation = (int)(tank.TurretRotation * 1000)
            });

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
                        float centerX = projectileTileX + 0.5f;
                        float centerY = projectileTileY + 0.5f;
                        foreach (var terrainDetail in ctx.Db.terrain_detail.WorldId_PositionX_PositionY.Filter((args.WorldId, centerX, centerY)))
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

            for (int regionX = minRegionX; regionX <= maxRegionX; regionX++)
            {
                if (regionX < 0) continue;

                for (int regionY = minRegionY; regionY <= maxRegionY; regionY++)
                {
                    if (regionY < 0) continue;

                    foreach (var tank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((args.WorldId, regionX, regionY)))
                    {
                        float dx = tank.PositionX - projectile.PositionX;
                        float dy = tank.PositionY - projectile.PositionY;
                        float distanceSquared = dx * dx + dy * dy;
                        float collisionRadiusSquared = totalCollisionRadius * totalCollisionRadius;

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

                    if (collided) break;
                }

                if (collided) break;
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
            GameState = GameState.Playing,
            GameStartedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            GameDurationMicros = Module.GAME_DURATION_MICROS
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
                PositionX = detail.x + 0.5f,
                PositionY = detail.y + 0.5f,
                Type = detail.type,
                Health = 100,
                Label = null,
                Rotation = detail.rotation
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

        var existingGameTimeCheck = ctx.Db.ScheduledGameTimeCheck.WorldId.Filter(args.WorldId);
        bool hasGameTimeCheck = false;
        foreach (var check in existingGameTimeCheck)
        {
            hasGameTimeCheck = true;
            break;
        }
        if (!hasGameTimeCheck)
        {
            ctx.Db.ScheduledGameTimeCheck.Insert(new GameTimer.ScheduledGameTimeCheck
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = 1_000_000 }),
                WorldId = args.WorldId
            });
        }

        Log.Info($"World {args.WorldId} reset complete. Teams randomized, {totalTanks} tanks respawned.");
    }
}
