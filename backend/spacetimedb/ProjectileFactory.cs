using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private static void CreateProjectile(ReducerContext ctx, Tank tank, float startX, float startY, float angle, Gun gun)
    {
        float velocityX = (float)Math.Cos(angle) * gun.ProjectileSpeed;
        float velocityY = (float)Math.Sin(angle) * gun.ProjectileSpeed;

        var (projectile, transform) = BuildProjectile(
            ctx: ctx,
            gameId: tank.GameId,
            shooterTankId: tank.Id,
            alliance: tank.Alliance,
            positionX: startX,
            positionY: startY,
            speed: gun.ProjectileSpeed,
            size: gun.ProjectileSize,
            velocity: new Vector2Float(velocityX, velocityY),
            damage: gun.Damage,
            trackingStrength: gun.TrackingStrength,
            trackingRadius: gun.TrackingRadius,
            projectileType: gun.ProjectileType,
            lifetimeSeconds: gun.LifetimeSeconds,
            returnsToShooter: gun.ProjectileType == ProjectileType.Boomerang,
            maxCollisions: gun.MaxCollisions,
            passThroughTerrain: gun.PassThroughTerrain,
            collisionRadius: gun.CollisionRadius,
            explosionRadius: gun.ExplosionRadius,
            explosionTrigger: gun.ExplosionTrigger,
            damping: gun.Damping,
            bounce: gun.Bounce
        );

        var insertedProjectile = ctx.Db.projectile.Insert(projectile);
        transform = transform with { ProjectileId = insertedProjectile.Id };
        ctx.Db.projectile_transform.Insert(transform);
    }
}
