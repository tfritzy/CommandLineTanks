using SpacetimeDB;

public static partial class Module
{
    public static (bool shouldDelete, Projectile projectile) IncrementProjectileCollision(
        ReducerContext ctx,
        Projectile projectile)
    {
        projectile = projectile with
        {
            CollisionCount = projectile.CollisionCount + 1
        };

        if (projectile.CollisionCount >= projectile.MaxCollisions)
        {
            ctx.Db.projectile.Id.Delete(projectile.Id);
            return (true, projectile);
        }

        return (false, projectile);
    }
}
