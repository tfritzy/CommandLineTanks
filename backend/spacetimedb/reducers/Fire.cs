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

        var gunQuery = GetTankGunAtIndex(ctx, tank.Id, tank.SelectedGunIndex);
        if (gunQuery == null) return tank;
        var gun = gunQuery.Value;

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

            if (gun.Ammo <= 0)
            {
                DeleteTankGunAtIndex(ctx, tank.Id, tank.SelectedGunIndex);
                
                int gunCount = GetTankGunCount(ctx, tank.Id);
                if (gunCount > 0)
                {
                    int firstNonBaseGunIndex = -1;
                    var guns = GetTankGuns(ctx, tank.Id);
                    for (int i = 0; i < guns.Length; i++)
                    {
                        if (guns[i].GunType != Types.GunType.Base)
                        {
                            firstNonBaseGunIndex = i;
                            break;
                        }
                    }
                    tank = tank with { SelectedGunIndex = firstNonBaseGunIndex >= 0 ? firstNonBaseGunIndex : 0 };
                }
                else
                {
                    tank = tank with { SelectedGunIndex = -1 };
                }
            }
            else
            {
                UpdateTankGunAtIndex(ctx, tank.Id, tank.SelectedGunIndex, gun);
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
