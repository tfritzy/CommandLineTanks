using SpacetimeDB;
using static Types;

public static partial class ProjectileUpdater
{
    public static bool ExplodeProjectileCommand(ReducerContext ctx, Module.Projectile projectile, string worldId, ref Module.ProjectileCollisionMap projectileCollisionMap)
    {
        if (projectile.ExplosionRadius == null || projectile.ExplosionRadius <= 0)
        {
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

                if (tileX < 0 || tileX >= projectileCollisionMap.Width ||
                    tileY < 0 || tileY >= projectileCollisionMap.Height)
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
                    int tileIndex = tileY * projectileCollisionMap.Width + tileX;
                    if (DamageTerrainAtTile(ctx, worldId, tileX, tileY, tileIndex, projectile.Damage, ref projectileCollisionMap))
                    {
                        traversibilityMapChanged = true;
                    }
                }
            }
        }

        Log.Info($"Projectile exploded at ({projectile.PositionX}, {projectile.PositionY})");
        return traversibilityMapChanged;
    }

    private static bool DamageTerrainAtTile(
        ReducerContext ctx,
        string worldId,
        int gridX,
        int gridY,
        int tileIndex,
        int damage,
        ref Module.ProjectileCollisionMap projectileCollisionMap)
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

                projectileCollisionMap.Map[tileIndex] = true;

                var traversibilityMapQuery = ctx.Db.traversibility_map.WorldId.Find(worldId);
                if (traversibilityMapQuery != null)
                {
                    var traversibilityMap = traversibilityMapQuery.Value;
                    traversibilityMap.Map[tileIndex] = true;
                    ctx.Db.traversibility_map.WorldId.Update(traversibilityMap);
                }

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
