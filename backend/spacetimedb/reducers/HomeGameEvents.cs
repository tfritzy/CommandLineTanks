using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    [Reducer]
    public static void homegameProjectileTankHit(ReducerContext ctx, ulong projectileId, string targetTankId)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        
        var game = ctx.Db.game.Id.Find(identityString);
        if (game == null || !game.Value.IsHomeGame)
        {
            return;
        }

        var projectile = ctx.Db.projectile.Id.Find(projectileId);
        if (projectile == null || projectile.Value.GameId != identityString)
        {
            return;
        }

        var tank = ctx.Db.tank.Id.Find(targetTankId);
        if (tank == null || tank.Value.GameId != identityString)
        {
            return;
        }

        var tankTransform = ctx.Db.tank_transform.TankId.Find(targetTankId);
        if (tankTransform == null)
        {
            return;
        }

        if (tank.Value.Alliance == projectile.Value.Alliance)
        {
            return;
        }

        if (tank.Value.Health <= 0 || tank.Value.RemainingImmunityMicros > 0)
        {
            return;
        }

        var projectileTransform = ctx.Db.projectile_transform.ProjectileId.Find(projectileId);
        if (projectileTransform == null)
        {
            return;
        }

        if (projectile.Value.ReturnsToShooter && projectile.Value.IsReturning && tank.Value.Id == projectile.Value.ShooterTankId)
        {
            HandleBoomerangReturn(ctx, projectile.Value, tank.Value);
            return;
        }

        if (projectile.Value.ExplosionRadius != null && projectile.Value.ExplosionRadius > 0)
        {
            if (projectile.Value.ExplosionTrigger == ExplosionTrigger.OnHit)
            {
                var traversibilityMapQuery = ctx.Db.traversibility_map.GameId.Find(identityString);
                var projectileTraversibilityMapQuery = ctx.Db.projectile_traversibility_map.GameId.Find(identityString);
                if (traversibilityMapQuery != null && projectileTraversibilityMapQuery != null)
                {
                    var traversibilityMap = traversibilityMapQuery.Value;
                    var projectileTraversibilityMap = projectileTraversibilityMapQuery.Value;
                    bool tankMapChanged;
                    bool projectileMapChanged;
                    (tankMapChanged, projectileMapChanged) = ProjectileUpdater.ExplodeProjectileCommand(ctx, projectile.Value, projectileTransform.Value, identityString, ref traversibilityMap, ref projectileTraversibilityMap);
                    if (tankMapChanged)
                    {
                        ctx.Db.traversibility_map.GameId.Update(traversibilityMap);
                    }
                    if (projectileMapChanged)
                    {
                        ctx.Db.projectile_traversibility_map.GameId.Update(projectileTraversibilityMap);
                    }
                }
                ProjectileUpdater.DeleteProjectile(ctx, projectileId);
                return;
            }
        }
        else
        {
            DealDamageToTankCommand(ctx, tank.Value, tankTransform.Value, projectile.Value.Damage, projectile.Value.ShooterTankId, projectile.Value.Alliance, identityString);
        }

        var (shouldDelete, newTransform) = IncrementProjectileCollision(ctx, projectile.Value, projectileTransform.Value);
        if (!shouldDelete)
        {
            ctx.Db.projectile_transform.ProjectileId.Update(newTransform);
        }
    }

    [Reducer]
    public static void homegameProjectileTerrainHit(ReducerContext ctx, ulong projectileId, int gridX, int gridY)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        
        var game = ctx.Db.game.Id.Find(identityString);
        if (game == null || !game.Value.IsHomeGame)
        {
            return;
        }

        var projectile = ctx.Db.projectile.Id.Find(projectileId);
        if (projectile == null || projectile.Value.GameId != identityString)
        {
            return;
        }

        var projectileTransform = ctx.Db.projectile_transform.ProjectileId.Find(projectileId);
        if (projectileTransform == null)
        {
            return;
        }

        if (projectile.Value.PassThroughTerrain)
        {
            return;
        }

        if (projectile.Value.Bounce)
        {
            return;
        }

        var traversibilityMapQuery = ctx.Db.traversibility_map.GameId.Find(identityString);
        if (traversibilityMapQuery == null)
        {
            return;
        }

        var projectileTraversibilityMapQuery = ctx.Db.projectile_traversibility_map.GameId.Find(identityString);
        if (projectileTraversibilityMapQuery == null)
        {
            return;
        }

        var traversibilityMap = traversibilityMapQuery.Value;
        var projectileTraversibilityMap = projectileTraversibilityMapQuery.Value;

        if (gridX < 0 || gridX >= projectileTraversibilityMap.Width || gridY < 0 || gridY >= projectileTraversibilityMap.Height)
        {
            return;
        }

        int tileIndex = gridY * projectileTraversibilityMap.Width + gridX;
        if (projectileTraversibilityMap.IsTraversable(tileIndex))
        {
            return;
        }

        if (projectile.Value.ExplosionRadius != null && projectile.Value.ExplosionRadius > 0 && projectile.Value.ExplosionTrigger == ExplosionTrigger.OnHit)
        {
            bool tankMapChanged;
            bool projectileMapChanged;
            (tankMapChanged, projectileMapChanged) = ProjectileUpdater.ExplodeProjectileCommand(ctx, projectile.Value, projectileTransform.Value, identityString, ref traversibilityMap, ref projectileTraversibilityMap);
            if (tankMapChanged)
            {
                ctx.Db.traversibility_map.GameId.Update(traversibilityMap);
            }
            if (projectileMapChanged)
            {
                ctx.Db.projectile_traversibility_map.GameId.Update(projectileTraversibilityMap);
            }
            ProjectileUpdater.DeleteProjectile(ctx, projectileId);
            return;
        }

        var terrainDetail = ctx.Db.terrain_detail.GameId_GridX_GridY.Filter((identityString, gridX, gridY)).FirstOrDefault();
        if (terrainDetail.Id != null && terrainDetail.Health != null)
        {
            var newHealth = terrainDetail.Health.Value - projectile.Value.Damage;
            if (newHealth <= 0)
            {
                ctx.Db.terrain_detail.Id.Delete(terrainDetail.Id);
                traversibilityMap.SetTraversable(tileIndex, true);
                projectileTraversibilityMap.SetTraversable(tileIndex, true);
                ctx.Db.traversibility_map.GameId.Update(traversibilityMap);
                ctx.Db.projectile_traversibility_map.GameId.Update(projectileTraversibilityMap);
            }
            else
            {
                var updatedDetail = terrainDetail with { Health = newHealth };
                ctx.Db.terrain_detail.Id.Update(updatedDetail);
            }
        }

        ProjectileUpdater.DeleteProjectile(ctx, projectileId);
    }

    [Reducer]
    public static void homegameProjectileExpire(ReducerContext ctx, ulong projectileId)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        
        var game = ctx.Db.game.Id.Find(identityString);
        if (game == null || !game.Value.IsHomeGame)
        {
            return;
        }

        var projectile = ctx.Db.projectile.Id.Find(projectileId);
        if (projectile == null || projectile.Value.GameId != identityString)
        {
            return;
        }

        var projectileTransform = ctx.Db.projectile_transform.ProjectileId.Find(projectileId);
        if (projectileTransform == null)
        {
            ProjectileUpdater.DeleteProjectile(ctx, projectileId);
            return;
        }

        if (projectile.Value.ExplosionTrigger == ExplosionTrigger.OnExpiration)
        {
            var traversibilityMapQuery = ctx.Db.traversibility_map.GameId.Find(identityString);
            var projectileTraversibilityMapQuery = ctx.Db.projectile_traversibility_map.GameId.Find(identityString);
            if (traversibilityMapQuery != null && projectileTraversibilityMapQuery != null)
            {
                var traversibilityMap = traversibilityMapQuery.Value;
                var projectileTraversibilityMap = projectileTraversibilityMapQuery.Value;
                bool tankMapChanged;
                bool projectileMapChanged;
                (tankMapChanged, projectileMapChanged) = ProjectileUpdater.ExplodeProjectileCommand(ctx, projectile.Value, projectileTransform.Value, identityString, ref traversibilityMap, ref projectileTraversibilityMap);
                if (tankMapChanged)
                {
                    ctx.Db.traversibility_map.GameId.Update(traversibilityMap);
                }
                if (projectileMapChanged)
                {
                    ctx.Db.projectile_traversibility_map.GameId.Update(projectileTraversibilityMap);
                }
            }
        }

        ProjectileUpdater.DeleteProjectile(ctx, projectileId);
    }

    private static void HandleBoomerangReturn(ReducerContext ctx, Projectile projectile, Tank tank)
    {
        int existingGunIndex = -1;
        for (int i = 0; i < tank.Guns.Length; i++)
        {
            if (tank.Guns[i].GunType == GunType.Boomerang)
            {
                existingGunIndex = i;
                break;
            }
        }

        if (existingGunIndex >= 0)
        {
            var gun = tank.Guns[existingGunIndex];
            if (gun.Ammo != null)
            {
                gun.Ammo = gun.Ammo.Value + 1;
                tank.Guns[existingGunIndex] = gun;
                ctx.Db.tank.Id.Update(tank);
            }
        }
        else if (tank.Guns.Length < 3)
        {
            var boomerangGun = BOOMERANG_GUN with { Ammo = 1 };
            var newGunIndex = tank.Guns.Length;
            tank = tank with
            {
                Guns = [.. tank.Guns, boomerangGun],
                SelectedGunIndex = newGunIndex
            };
            ctx.Db.tank.Id.Update(tank);
        }

        ProjectileUpdater.DeleteProjectile(ctx, projectile.Id);
    }
}
