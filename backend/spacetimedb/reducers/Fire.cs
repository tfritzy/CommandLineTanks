using SpacetimeDB;
using System;

public static partial class Module
{
    [Reducer]
    public static void fire(ReducerContext ctx, string gameId)
    {
        Tank? tankQuery = ctx.Db.tank.GameId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;
        
        var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
        if (transformQuery == null) return;
        var transform = transformQuery.Value;

        tank = FireTankWeapon(ctx, tank, transform);
        ctx.Db.tank.Id.Update(tank);
    }

    public static Tank FireTankWeapon(ReducerContext ctx, Tank tank)
    {
        var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
        if (transformQuery == null) return tank;
        return FireTankWeapon(ctx, tank, transformQuery.Value);
    }

    public static Tank FireTankWeapon(ReducerContext ctx, Tank tank, TankTransform transform)
    {
        if (tank.Health <= 0) return tank;

        ulong currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var fireState = ctx.Db.tank_fire_state.TankId.Find(tank.Id);
        if (fireState != null && fireState.Value.LastFireTime != 0)
        {
            ulong timeSinceLastFire = currentTime - fireState.Value.LastFireTime;
            if (timeSinceLastFire < FIRE_RATE_LIMIT_MICROS) return tank;
        }

        if (tank.SelectedGunIndex < 0 || tank.SelectedGunIndex >= tank.Guns.Length) return tank;

        var gun = tank.Guns[tank.SelectedGunIndex];

        if (gun.Ammo != null && gun.Ammo <= 0) return tank;

        if (gun.ProjectileCount == 1)
        {
            CreateProjectile(ctx, tank, transform.PositionX, transform.PositionY, transform.TurretRotation, gun);
        }
        else
        {
            float halfSpread = gun.SpreadAngle * (gun.ProjectileCount - 1) / 2.0f;
            for (int i = 0; i < gun.ProjectileCount; i++)
            {
                float angle = transform.TurretRotation - halfSpread + (i * gun.SpreadAngle);
                float posX = transform.PositionX;
                float posY = transform.PositionY;

                if (gun.GunType == Types.GunType.TripleShooter)
                {
                    if (i == 1)
                    {
                        float forwardOffset = 0.2f;
                        posX += (float)Math.Cos(transform.TurretRotation) * forwardOffset;
                        posY += (float)Math.Sin(transform.TurretRotation) * forwardOffset;
                    }
                    else
                    {
                        float lateralOffset = (i - 1) * 0.25f;
                        posX += (float)Math.Cos(transform.TurretRotation + Math.PI / 2.0) * lateralOffset;
                        posY += (float)Math.Sin(transform.TurretRotation + Math.PI / 2.0) * lateralOffset;
                    }
                }

                CreateProjectile(ctx, tank, posX, posY, angle, gun);
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
                    int firstNonBaseGunIndex = -1;
                    for (int i = 0; i < tank.Guns.Length; i++)
                    {
                        if (tank.Guns[i].GunType != Types.GunType.Base)
                        {
                            firstNonBaseGunIndex = i;
                            break;
                        }
                    }
                    tank.SelectedGunIndex = firstNonBaseGunIndex >= 0 ? firstNonBaseGunIndex : 0;
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

        var newFireState = new TankFireState
        {
            TankId = tank.Id,
            GameId = tank.GameId,
            LastFireTime = currentTime
        };
        if (fireState != null)
        {
            ctx.Db.tank_fire_state.TankId.Update(newFireState);
        }
        else
        {
            ctx.Db.tank_fire_state.Insert(newFireState);
        }

        return tank;
    }
}
