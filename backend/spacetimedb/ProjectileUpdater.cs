using SpacetimeDB;
using static Types;
using System.Collections.Generic;

public static partial class ProjectileUpdater
{
    [Table(Scheduled = nameof(UpdateProjectiles))]
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

        foreach (var iProjectile in ctx.Db.projectile.WorldId.Filter(args.WorldId))
        {
            var projectile = iProjectile;

            if (projectile.TrackingStrength > 0)
            {
                int projectileCollisionRegionX = (int)Math.Floor(projectile.PositionX / Module.COLLISION_REGION_SIZE);
                int projectileCollisionRegionY = (int)Math.Floor(projectile.PositionY / Module.COLLISION_REGION_SIZE);

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
                            if (tank.Alliance != projectile.Alliance && !tank.IsDead)
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

            int projectileCollisionRegionX = (int)Math.Floor(projectile.PositionX / Module.COLLISION_REGION_SIZE);
            int projectileCollisionRegionY = (int)Math.Floor(projectile.PositionY / Module.COLLISION_REGION_SIZE);

            bool collided = false;

            foreach (var tank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((args.WorldId, projectileCollisionRegionX, projectileCollisionRegionY)))
            {
                if (tank.Alliance != projectile.Alliance)
                {
                    float dx = tank.PositionX - projectile.PositionX;
                    float dy = tank.PositionY - projectile.PositionY;
                    float distanceSquared = dx * dx + dy * dy;

                    if (distanceSquared <= projectile.Size * projectile.Size)
                    {
                        var newHealth = tank.Health - projectile.Damage;
                        var isDead = newHealth <= 0;
                        var updatedTank = tank with
                        {
                            Health = newHealth,
                            IsDead = isDead
                        };
                        ctx.Db.tank.Id.Update(updatedTank);

                        if (isDead)
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

                            var score = ctx.Db.score.WorldId.Find(args.WorldId);
                            if (score != null)
                            {
                                var updatedScore = score.Value;
                                if (projectile.Alliance >= 0 && projectile.Alliance < updatedScore.Kills.Length)
                                {
                                    updatedScore.Kills[projectile.Alliance]++;
                                    ctx.Db.score.WorldId.Update(updatedScore);

                                    if (updatedScore.Kills[projectile.Alliance] >= Module.KILL_LIMIT)
                                    {
                                        var world = ctx.Db.world.Id.Find(args.WorldId);
                                        if (world != null && world.Value.GameState == GameState.Playing)
                                        {
                                            var updatedWorld = world.Value with { GameState = GameState.Results };
                                            ctx.Db.world.Id.Update(updatedWorld);

                                            ctx.Db.ScheduledWorldReset.Insert(new ScheduledWorldReset
                                            {
                                                ScheduledId = 0,
                                                ScheduledAt = new ScheduleAt.Time(ctx.Timestamp.AddMicroseconds(Module.WORLD_RESET_DELAY_MICROS)),
                                                WorldId = args.WorldId
                                            });

                                            Log.Info($"Team {projectile.Alliance} reached {Module.KILL_LIMIT} kills! Game ending in 30 seconds...");
                                        }
                                    }
                                }
                            }
                        }

                        ctx.Db.projectile.Id.Delete(projectile.Id);
                        collided = true;
                        break;
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
                Map = traversibilityMap
            });
        }
        else
        {
            ctx.Db.traversibility_map.Insert(new Module.TraversibilityMap
            {
                WorldId = args.WorldId,
                Map = traversibilityMap
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

            var (spawnX, spawnY) = Module.FindSpawnPosition(ctx, updatedWorld, newAlliance, ctx.Rng);

            var resetTank = tank with
            {
                Alliance = newAlliance,
                Health = Module.TANK_HEALTH,
                IsDead = false,
                Kills = 0,
                PositionX = spawnX,
                PositionY = spawnY,
                Path = Array.Empty<PathEntry>(),
                Velocity = new Vector2Float(0, 0),
                BodyAngularVelocity = 0,
                TurretAngularVelocity = 0,
                Target = null,
                TargetLead = 0.0f,
                Guns = [Module.BASE_GUN],
                SelectedGunIndex = 0
            };

            ctx.Db.tank.Id.Update(resetTank);
        }

        foreach (var projectile in ctx.Db.projectile.WorldId.Filter(args.WorldId))
        {
            ctx.Db.projectile.Id.Delete(projectile.Id);
        }

        Log.Info($"World {args.WorldId} reset complete. Teams randomized, {totalTanks} tanks respawned.");
    }
}
