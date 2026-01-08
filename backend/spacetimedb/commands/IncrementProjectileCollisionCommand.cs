using SpacetimeDB;

public static partial class Module
{
    public static (bool shouldDelete, ProjectileTransform transform) IncrementProjectileCollision(
        ReducerContext ctx,
        Projectile projectile,
        ProjectileTransform transform)
    {
        transform = transform with
        {
            CollisionCount = transform.CollisionCount + 1
        };

        if (transform.CollisionCount >= projectile.MaxCollisions)
        {
            ctx.Db.projectile.Id.Delete(projectile.Id);
            ctx.Db.projectile_transform.ProjectileId.Delete(transform.ProjectileId);
            return (true, transform);
        }

        return (false, transform);
    }
}
