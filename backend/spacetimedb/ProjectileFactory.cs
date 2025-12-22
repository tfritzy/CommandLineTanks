using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    public static void CreateProjectile(ReducerContext ctx, Tank tank, float startX, float startY, float angle, Gun gun)
    {
        float velocityX = (float)Math.Cos(angle) * PROJECTILE_SPEED;
        float velocityY = (float)Math.Sin(angle) * PROJECTILE_SPEED;

        var projectileId = GenerateId(ctx, "prj");
        var projectile = new Projectile
        {
            Id = projectileId,
            WorldId = tank.WorldId,
            ShooterTankId = tank.Id,
            Alliance = tank.Alliance,
            PositionX = startX,
            PositionY = startY,
            Speed = PROJECTILE_SPEED,
            Size = PROJECTILE_SIZE,
            Velocity = new Vector2Float(velocityX, velocityY),
            Damage = gun.Damage,
            TrackingStrength = gun.TrackingStrength,
            ProjectileType = gun.ProjectileType,
            SpawnedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            LifetimeSeconds = gun.LifetimeSeconds,
            ReturnsToShooter = gun.ProjectileType == ProjectileType.Boomerang,
            IsReturning = false,
            MaxCollisions = gun.MaxCollisions,
            CollisionCount = 0,
            PassThroughTerrain = gun.PassThroughTerrain,
            CollisionRadius = gun.CollisionRadius,
            ExplosionRadius = gun.ExplosionRadius,
            ExplosionTrigger = gun.ExplosionTrigger,
            BounceDamping = gun.BounceDamping
        };

        ctx.Db.projectile.Insert(projectile);
    }
}
