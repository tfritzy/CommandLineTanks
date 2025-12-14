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
                        var newHealth = tank.Health - Module.PROJECTILE_DAMAGE;
                        var isDead = newHealth <= 0;
                        var updatedTank = tank with
                        {
                            Health = newHealth,
                            IsDead = isDead
                        };
                        ctx.Db.tank.Id.Update(updatedTank);

                        if (isDead)
                        {
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
                                        if (world != null && world.Value.GameMode == GameMode.Playing)
                                        {
                                            var updatedWorld = world.Value with { GameMode = GameMode.Results };
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

        var (baseTerrain, terrainDetail) = TerrainGenerator.GenerateTerrain(ctx.Rng);
        var traversibilityMap = TerrainGenerator.CalculateTraversibility(baseTerrain, terrainDetail);

        var updatedWorld = world.Value with
        {
            BaseTerrainLayer = baseTerrain,
            TerrainDetailLayer = terrainDetail,
            TraversibilityMap = traversibilityMap,
            GameMode = GameMode.Playing
        };
        ctx.Db.world.Id.Update(updatedWorld);

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

            var (spawnX, spawnY) = Module.FindSpawnPosition(updatedWorld, newAlliance, ctx.Rng);

            var resetTank = tank with
            {
                Alliance = newAlliance,
                Health = Module.TANK_HEALTH,
                IsDead = false,
                PositionX = spawnX,
                PositionY = spawnY,
                Path = Array.Empty<PathEntry>(),
                Velocity = new Vector2Float(0, 0),
                BodyAngularVelocity = 0,
                TurretAngularVelocity = 0,
                Target = null,
                TargetLead = 0.0f
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
