using SpacetimeDB;
using System;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void fire(ReducerContext ctx, string gameId)
    {
        MaybeResumeUpdatersForHomeworld(ctx, gameId);

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

        Gun gun;
        TankGun? tankGunEntry = null;
        
        if (tank.SelectedGunIndex == 0)
        {
            gun = BASE_GUN;
        }
        else
        {
            var gunQuery = ctx.Db.tank_gun.TankId_SlotIndex.Filter((tank.Id, tank.SelectedGunIndex)).FirstOrDefault();
            if (gunQuery.TankId == null) return tank;
            tankGunEntry = gunQuery;
            gun = gunQuery.Gun;
        }

        if (gun.Ammo != null && gun.Ammo <= 0) return tank;

        if (gun.ProjectileCount == 1)
        {
            float barrelTipX = transform.PositionX + (float)Math.Cos(transform.TurretRotation) * GUN_BARREL_LENGTH;
            float barrelTipY = transform.PositionY + (float)Math.Sin(transform.TurretRotation) * GUN_BARREL_LENGTH;
            CreateProjectile(ctx, tank, barrelTipX, barrelTipY, transform.TurretRotation, gun);
        }
        else
        {
            float barrelTipX = transform.PositionX + (float)Math.Cos(transform.TurretRotation) * GUN_BARREL_LENGTH;
            float barrelTipY = transform.PositionY + (float)Math.Sin(transform.TurretRotation) * GUN_BARREL_LENGTH;
            float halfSpread = gun.SpreadAngle * (gun.ProjectileCount - 1) / 2.0f;
            for (int i = 0; i < gun.ProjectileCount; i++)
            {
                float angle = transform.TurretRotation - halfSpread + (i * gun.SpreadAngle);
                float posX = barrelTipX;
                float posY = barrelTipY;

                if (gun.GunType == GunType.TripleShooter)
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

        if (gun.Ammo != null && tankGunEntry != null)
        {
            gun.Ammo = gun.Ammo.Value - 1;

            if (gun.Ammo <= 0)
            {
                int deletedSlot = tank.SelectedGunIndex;
                ctx.Db.tank_gun.Id.Delete(tankGunEntry.Value.Id);

                int lowestNonBaseSlot = int.MaxValue;
                foreach (var g in ctx.Db.tank_gun.TankId.Filter(tank.Id))
                {
                    if (g.SlotIndex > deletedSlot)
                    {
                        ctx.Db.tank_gun.Id.Update(g with { SlotIndex = g.SlotIndex - 1 });
                    }
                    int newSlotIndex = g.SlotIndex > deletedSlot ? g.SlotIndex - 1 : g.SlotIndex;
                    if (newSlotIndex < lowestNonBaseSlot)
                    {
                        lowestNonBaseSlot = newSlotIndex;
                    }
                }

                tank.SelectedGunIndex = lowestNonBaseSlot < int.MaxValue ? lowestNonBaseSlot : 0;
            }
            else
            {
                ctx.Db.tank_gun.Id.Update(tankGunEntry.Value with { Gun = gun });
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
