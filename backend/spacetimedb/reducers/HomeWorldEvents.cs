using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    [Reducer]
    public static void homeWorldProjectileTankHit(ReducerContext ctx, ulong projectileId, string targetTankId)
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
                if (traversibilityMapQuery != null)
                {
                    var traversibilityMap = traversibilityMapQuery.Value;
                    var updateContext = new ProjectileUpdater.ProjectileUpdateContext(ctx, identityString, (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch);
                    ProjectileUpdater.ExplodeProjectileCommand(ctx, updateContext, projectile.Value, projectileTransform.Value, identityString, ref traversibilityMap);
                    ctx.Db.traversibility_map.GameId.Update(traversibilityMap);
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
    public static void homeWorldProjectileTerrainHit(ReducerContext ctx, ulong projectileId, int gridX, int gridY)
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

        var traversibilityMap = traversibilityMapQuery.Value;

        if (gridX < 0 || gridX >= traversibilityMap.Width || gridY < 0 || gridY >= traversibilityMap.Height)
        {
            return;
        }

        int tileIndex = gridY * traversibilityMap.Width + gridX;
        if (traversibilityMap.IsTraversable(tileIndex))
        {
            return;
        }

        if (projectile.Value.ExplosionRadius != null && projectile.Value.ExplosionRadius > 0 && projectile.Value.ExplosionTrigger == ExplosionTrigger.OnHit)
        {
            var updateContext = new ProjectileUpdater.ProjectileUpdateContext(ctx, identityString, (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch);
            ProjectileUpdater.ExplodeProjectileCommand(ctx, updateContext, projectile.Value, projectileTransform.Value, identityString, ref traversibilityMap);
            ctx.Db.traversibility_map.GameId.Update(traversibilityMap);
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
                ctx.Db.traversibility_map.GameId.Update(traversibilityMap);
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
    public static void homeWorldProjectileExpire(ReducerContext ctx, ulong projectileId)
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
            if (traversibilityMapQuery != null)
            {
                var traversibilityMap = traversibilityMapQuery.Value;
                var updateContext = new ProjectileUpdater.ProjectileUpdateContext(ctx, identityString, (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch);
                ProjectileUpdater.ExplodeProjectileCommand(ctx, updateContext, projectile.Value, projectileTransform.Value, identityString, ref traversibilityMap);
                ctx.Db.traversibility_map.GameId.Update(traversibilityMap);
            }
        }

        ProjectileUpdater.DeleteProjectile(ctx, projectileId);
    }

    private static void HandleBoomerangReturn(ReducerContext ctx, Projectile projectile, Tank tank)
    {
        int existingGunIndex = -1;
        var guns = GetTankGuns(ctx, tank.Id);
        for (int i = 0; i < guns.Length; i++)
        {
            if (guns[i].GunType == GunType.Boomerang)
            {
                existingGunIndex = i;
                break;
            }
        }

        if (existingGunIndex >= 0)
        {
            var gun = guns[existingGunIndex];
            if (gun.Ammo != null)
            {
                gun.Ammo = gun.Ammo.Value + 1;
                UpdateTankGunAtIndex(ctx, tank.Id, existingGunIndex, gun);
            }
        }
        else if (guns.Length < 3)
        {
            var boomerangGun = BOOMERANG_GUN with { Ammo = 1 };
            AddTankGun(ctx, tank.Id, tank.GameId, boomerangGun);
            tank = tank with { SelectedGunIndex = guns.Length };
            ctx.Db.tank.Id.Update(tank);
        }

        ProjectileUpdater.DeleteProjectile(ctx, projectile.Id);
    }
}
