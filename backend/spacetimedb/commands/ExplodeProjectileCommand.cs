using SpacetimeDB;
using static Types;
using System;

public static partial class ProjectileUpdater
{
    public static bool ExplodeProjectileCommand(ReducerContext ctx, Module.Projectile projectile, Module.ProjectileTransform transform, string gameId, ref Module.TraversibilityMap traversibilityMap)
    {
        if (projectile.ExplosionRadius == null || projectile.ExplosionRadius <= 0)
        {
            return false;
        }

        if (projectile.ProjectileType == ProjectileType.Grenade)
        {
            SpawnGrenadeSubProjectiles(ctx, projectile, transform);
            return false;
        }

        float explosionRadius = projectile.ExplosionRadius.Value;
        int projectileCollisionRegionX = (int)(transform.PositionX / Module.COLLISION_REGION_SIZE);
        int projectileCollisionRegionY = (int)(transform.PositionY / Module.COLLISION_REGION_SIZE);

        int searchRadius = (int)Math.Ceiling(explosionRadius / Module.COLLISION_REGION_SIZE);

        for (int dx = -searchRadius; dx <= searchRadius; dx++)
        {
            for (int dy = -searchRadius; dy <= searchRadius; dy++)
            {
                int regionX = projectileCollisionRegionX + dx;
                int regionY = projectileCollisionRegionY + dy;

                var tankTransforms = ctx.Db.tank_transform.GameId_CollisionRegionX_CollisionRegionY.Filter((gameId, regionX, regionY));
                foreach (var tankTransform in tankTransforms)
                {
                    var tankQuery = ctx.Db.tank.Id.Find(tankTransform.TankId);
                    if (tankQuery == null) continue;
                    var tank = tankQuery.Value;
                    
                    if (tank.Health > 0 && tank.Alliance != projectile.Alliance)
                    {
                        float dx_tank = tankTransform.PositionX - transform.PositionX;
                        float dy_tank = tankTransform.PositionY - transform.PositionY;
                        float distanceSquared = dx_tank * dx_tank + dy_tank * dy_tank;
                        float explosionRadiusSquared = explosionRadius * explosionRadius;

                        if (distanceSquared <= explosionRadiusSquared)
                        {
                            Module.DealDamageToTankCommand(ctx, tank, tankTransform, projectile.Damage, projectile.ShooterTankId, projectile.Alliance, gameId);
                        }
                    }
                }
            }
        }

        int explosionTileRadius = (int)Math.Ceiling(explosionRadius);
        int explosionTileX = (int)transform.PositionX;
        int explosionTileY = (int)transform.PositionY;

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

                float dx_tile = tileCenterX - transform.PositionX;
                float dy_tile = tileCenterY - transform.PositionY;
                float distanceSquared = dx_tile * dx_tile + dy_tile * dy_tile;
                float explosionRadiusSquared = explosionRadius * explosionRadius;

                if (distanceSquared <= explosionRadiusSquared)
                {
                    int tileIndex = tileY * traversibilityMap.Width + tileX;
                    if (DamageTerrainAtTile(ctx, gameId, tileX, tileY, tileIndex, projectile.Damage, ref traversibilityMap))
                    {
                        traversibilityMapChanged = true;
                    }
                }
            }
        }

        Log.Info($"Projectile exploded at ({transform.PositionX}, {transform.PositionY})");
        return traversibilityMapChanged;
    }

    private static void SpawnGrenadeSubProjectiles(ReducerContext ctx, Module.Projectile grenade, Module.ProjectileTransform grenadeTransform)
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

            var (subProjectile, subTransform) = Module.BuildProjectile(
                ctx: ctx,
                gameId: grenade.GameId,
                shooterTankId: grenade.ShooterTankId,
                alliance: grenade.Alliance,
                positionX: grenadeTransform.PositionX,
                positionY: grenadeTransform.PositionY,
                speed: speed,
                velocity: new Vector2Float(velocityX, velocityY),
                lifetimeSeconds: subProjectileLifetime
            );

            var insertedSubProjectile = ctx.Db.projectile.Insert(subProjectile);
            subTransform = subTransform with { ProjectileId = insertedSubProjectile.Id };
            ctx.Db.projectile_transform.Insert(subTransform);
        }
    }

    private static bool DamageTerrainAtTile(
        ReducerContext ctx,
        string gameId,
        int gridX,
        int gridY,
        int tileIndex,
        int damage,
        ref Module.TraversibilityMap traversibilityMap)
    {
        var terrainDetail = ctx.Db.terrain_detail.GameId_GridX_GridY.Filter((gameId, gridX, gridY)).FirstOrDefault();
        if (!terrainDetail.HasValue || terrainDetail.Value.Health == null)
        {
            return false;
        }

        var detail = terrainDetail.Value;
        var newHealth = detail.Health.Value - damage;
        if (newHealth <= 0)
        {
            ctx.Db.terrain_detail.Id.Delete(detail.Id);
            traversibilityMap.SetTraversable(tileIndex, true);
            return true;
        }
        else
        {
            var updatedDetail = detail with
            {
                Health = newHealth
            };
            ctx.Db.terrain_detail.Id.Update(updatedDetail);
        }
        return false;
    }
}
