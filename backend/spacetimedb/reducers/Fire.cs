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
        if (tank.Health <= 0) return false;

        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        if (tank.LastFireTime != 0)
        {
            ulong timeSinceLastFire = currentTime - tank.LastFireTime;
            if (timeSinceLastFire < FIRE_RATE_LIMIT_MICROS) return false;
        }

        if (tank.SelectedGunIndex < 0 || tank.SelectedGunIndex >= tank.Guns.Length) return false;

        var gun = tank.Guns[tank.SelectedGunIndex];

        if (gun.Ammo != null && gun.Ammo <= 0) return false;

        if (gun.ProjectileCount == 1)
        {
            CreateProjectile(ctx, tank, tank.PositionX, tank.PositionY, tank.TurretRotation, gun);
        }
        else
        {
            float halfSpread = gun.SpreadAngle * (gun.ProjectileCount - 1) / 2.0f;
            for (int i = 0; i < gun.ProjectileCount; i++)
            {
                float angle = tank.TurretRotation - halfSpread + (i * gun.SpreadAngle);
                float posX = tank.PositionX;
                float posY = tank.PositionY;

                if (gun.GunType == Types.GunType.TripleShooter)
                {
                    if (i == 1)
                    {
                        float forwardOffset = 0.2f;
                        posX += (float)Math.Cos(tank.TurretRotation) * forwardOffset;
                        posY += (float)Math.Sin(tank.TurretRotation) * forwardOffset;
                    }
                    else
                    {
                        float lateralOffset = (i - 1) * 0.25f;
                        posX += (float)Math.Cos(tank.TurretRotation + Math.PI / 2.0) * lateralOffset;
                        posY += (float)Math.Sin(tank.TurretRotation + Math.PI / 2.0) * lateralOffset;
                    }
                }

                CreateProjectile(ctx, tank, posX, posY, angle, gun);
            }
        }

        if (gun.Ammo != null)
        {
            gun.Ammo = gun.Ammo.Value - 1;
            var updatedGuns = tank.Guns.ToArray();

            if (gun.Ammo <= 0 && gun.GunType != Types.GunType.Boomerang)
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
        }

        tank.LastFireTime = currentTime;
        ctx.Db.tank.Id.Update(tank);

        Log.Info($"Tank {tank.Name} fired {gun.GunType}. Ammo remaining: {gun.Ammo?.ToString() ?? "unlimited"}");
        return true;
    }
}
