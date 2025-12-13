using SpacetimeDB;
using static Types;

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
                                if (projectile.Alliance == 0)
                                {
                                    updatedScore.Alliance0Kills++;
                                }
                                else if (projectile.Alliance == 1)
                                {
                                    updatedScore.Alliance1Kills++;
                                }
                                ctx.Db.score.WorldId.Update(updatedScore);
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
}
