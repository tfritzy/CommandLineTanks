using SpacetimeDB;
using System;

public static partial class Module
{
    [Reducer]
    public static void fire(ReducerContext ctx, string worldId)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        FireTankWeapon(ctx, tank);
    }

    public static bool FireTankWeapon(ReducerContext ctx, Tank tank)
    {
        if (tank.IsDead) return false;

        if (tank.SelectedGunIndex < 0 || tank.SelectedGunIndex >= tank.Guns.Length) return false;

        var gun = tank.Guns[tank.SelectedGunIndex];

        if (gun.Ammo != null && gun.Ammo <= 0) return false;

        float barrelTipX = tank.PositionX + (float)Math.Cos(tank.TurretRotation) * GUN_BARREL_LENGTH;
        float barrelTipY = tank.PositionY + (float)Math.Sin(tank.TurretRotation) * GUN_BARREL_LENGTH;

        if (gun.ProjectileCount == 1)
        {
            CreateProjectile(ctx, tank, barrelTipX, barrelTipY, tank.TurretRotation, gun.Damage, gun.TrackingStrength, gun.ProjectileType, gun.LifetimeSeconds);
        }
        else
        {
            float halfSpread = gun.SpreadAngle * (gun.ProjectileCount - 1) / 2.0f;
            for (int i = 0; i < gun.ProjectileCount; i++)
            {
                float angle = tank.TurretRotation - halfSpread + (i * gun.SpreadAngle);
                CreateProjectile(ctx, tank, barrelTipX, barrelTipY, angle, gun.Damage, gun.TrackingStrength, gun.ProjectileType, gun.LifetimeSeconds);
            }
        }

        if (gun.Ammo != null)
        {
            gun.Ammo = gun.Ammo.Value - 1;
            var updatedGuns = tank.Guns.ToArray();

            if (gun.Ammo <= 0)
            {
                tank.Guns = tank.Guns.Where((_, index) => index != tank.SelectedGunIndex).ToArray();
                if (tank.Guns.Length > 0)
                {
                    tank.SelectedGunIndex = 0;
                }
                else
                {
                    tank.SelectedGunIndex = -1;
                }
            }
            else
            {
                updatedGuns[tank.SelectedGunIndex] = gun;
                tank.Guns = updatedGuns;
            }

            ctx.Db.tank.Id.Update(tank);
        }

        Log.Info($"Tank {tank.Name} fired {gun.GunType}. Ammo remaining: {gun.Ammo?.ToString() ?? "unlimited"}");
        return true;
    }
}
