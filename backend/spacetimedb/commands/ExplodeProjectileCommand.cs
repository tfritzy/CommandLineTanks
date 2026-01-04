using SpacetimeDB;
using static Types;
using System;

public static partial class ProjectileUpdater
{
    public static bool ExplodeProjectileCommand(ReducerContext ctx, Module.Projectile projectile, string worldId, ref Module.TraversibilityMap traversibilityMap)
    {
        if (projectile.ExplosionRadius == null || projectile.ExplosionRadius <= 0)
        {
            return false;
        }

        if (projectile.ProjectileType == ProjectileType.Grenade)
        {
            SpawnGrenadeSubProjectiles(ctx, projectile);
            return false;
        }

        float explosionRadius = projectile.ExplosionRadius.Value;
        int projectileCollisionRegionX = (int)(projectile.PositionX / Module.COLLISION_REGION_SIZE);
        int projectileCollisionRegionY = (int)(projectile.PositionY / Module.COLLISION_REGION_SIZE);

        int searchRadius = (int)Math.Ceiling(explosionRadius / Module.COLLISION_REGION_SIZE);

        for (int dx = -searchRadius; dx <= searchRadius; dx++)
        {
            for (int dy = -searchRadius; dy <= searchRadius; dy++)
            {
                int regionX = projectileCollisionRegionX + dx;
                int regionY = projectileCollisionRegionY + dy;

                foreach (var tank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((worldId, regionX, regionY)))
                {
                    if (tank.Health > 0 && tank.Alliance != projectile.Alliance)
                    {
                        float dx_tank = tank.PositionX - projectile.PositionX;
                        float dy_tank = tank.PositionY - projectile.PositionY;
                        float distanceSquared = dx_tank * dx_tank + dy_tank * dy_tank;
                        float explosionRadiusSquared = explosionRadius * explosionRadius;

                        if (distanceSquared <= explosionRadiusSquared)
                        {
                            Module.DealDamageToTankCommand(ctx, tank, projectile.Damage, projectile.ShooterTankId, projectile.Alliance, worldId);
                        }
                    }
                }
            }
        }

        int explosionTileRadius = (int)Math.Ceiling(explosionRadius);
        int explosionTileX = (int)projectile.PositionX;
        int explosionTileY = (int)projectile.PositionY;

        bool traversibilityMapChanged = false;

        for (int dx = -explosionTileRadius; dx <= explosionTileRadius; dx++)
        {
            for (int dy = -explosionTileRadius; dy <= explosionTileRadius; dy++)
            {
                int tileX = explosionTileX + dx;
                int tileY = explosionTileY + dy;

                if (tileX < 0 || tileX >= traversibilityMap.Width ||
                    tileY < 0 || tileY >= traversibilityMap.Height)
                {
                    continue;
                }

                float tileCenterX = tileX + 0.5f;
                float tileCenterY = tileY + 0.5f;

                float dx_tile = tileCenterX - projectile.PositionX;
                float dy_tile = tileCenterY - projectile.PositionY;
                float distanceSquared = dx_tile * dx_tile + dy_tile * dy_tile;
                float explosionRadiusSquared = explosionRadius * explosionRadius;

                if (distanceSquared <= explosionRadiusSquared)
                {
                    int tileIndex = tileY * traversibilityMap.Width + tileX;
                    if (DamageTerrainAtTile(ctx, worldId, tileX, tileY, tileIndex, projectile.Damage, ref traversibilityMap))
                    {
                        traversibilityMapChanged = true;
                    }
                }
            }
        }

        Log.Info($"Projectile exploded at ({projectile.PositionX}, {projectile.PositionY})");
        return traversibilityMapChanged;
    }

    private static void SpawnGrenadeSubProjectiles(ReducerContext ctx, Module.Projectile grenade)
    {
        const int subProjectileCount = 24;
        const float subProjectileSpeed = Module.PROJECTILE_SPEED * 1.5f;
        const float subProjectileLifetime = 5f;

        for (int i = 0; i < subProjectileCount; i++)
        {
            float speed = i % 2 == 0 ? subProjectileSpeed : subProjectileSpeed * .75f;
            float angle = (float)(2 * Math.PI * i / subProjectileCount);
            float velocityX = (float)Math.Cos(angle) * speed;
            float velocityY = (float)Math.Sin(angle) * speed;

            var subProjectile = Module.BuildProjectile(
                ctx: ctx,
                worldId: grenade.WorldId,
                shooterTankId: grenade.ShooterTankId,
                alliance: grenade.Alliance,
                positionX: grenade.PositionX,
                positionY: grenade.PositionY,
                speed: speed,
                velocity: new Vector2Float(velocityX, velocityY),
                lifetimeSeconds: subProjectileLifetime
            );

            ctx.Db.projectile.Insert(subProjectile);
        }
    }

    private static bool DamageTerrainAtTile(
        ReducerContext ctx,
        string worldId,
        int gridX,
        int gridY,
        int tileIndex,
        int damage,
        ref Module.TraversibilityMap traversibilityMap)
    {
        foreach (var terrainDetail in ctx.Db.terrain_detail.WorldId_GridX_GridY.Filter((worldId, gridX, gridY)))
        {
            if (terrainDetail.Health == null)
            {
                continue;
            }

            var newHealth = terrainDetail.Health.Value - damage;
            if (newHealth <= 0)
            {
                ctx.Db.terrain_detail.Id.Delete(terrainDetail.Id);

                traversibilityMap.Map[tileIndex] = true;
                return true;
            }
            else
            {
                ctx.Db.terrain_detail.Id.Update(terrainDetail with
                {
                    Health = newHealth
                });
            }
        }
        return false;
    }
}
