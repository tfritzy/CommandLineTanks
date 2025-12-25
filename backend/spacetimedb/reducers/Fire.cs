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

        if (gun.RaycastRange.HasValue)
        {
            FireRaycastWeapon(ctx, tank, gun);
        }
        else if (gun.ProjectileCount == 1)
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
        }

        tank.LastFireTime = currentTime;
        ctx.Db.tank.Id.Update(tank);

        Log.Info($"Tank {tank.Name} fired {gun.GunType}. Ammo remaining: {gun.Ammo?.ToString() ?? "unlimited"}");
        return true;
    }

    private static void FireRaycastWeapon(ReducerContext ctx, Tank tank, Types.Gun gun)
    {
        float raycastRange = gun.RaycastRange!.Value;
        float angle = tank.TurretRotation;
        
        float startX = tank.PositionX + (float)Math.Cos(angle) * GUN_BARREL_LENGTH;
        float startY = tank.PositionY + (float)Math.Sin(angle) * GUN_BARREL_LENGTH;
        
        float endX = startX + (float)Math.Cos(angle) * raycastRange;
        float endY = startY + (float)Math.Sin(angle) * raycastRange;

        var hitTanks = new System.Collections.Generic.List<Tank>();
        
        foreach (var targetTank in ctx.Db.tank.WorldId.Filter(tank.WorldId))
        {
            if (targetTank.Id == tank.Id || targetTank.Health <= 0) continue;
            if (targetTank.Alliance == tank.Alliance) continue;

            float distanceToLine = PointToLineDistance(
                targetTank.PositionX, targetTank.PositionY,
                startX, startY,
                endX, endY
            );

            if (distanceToLine <= TANK_COLLISION_RADIUS)
            {
                float tankDx = targetTank.PositionX - startX;
                float tankDy = targetTank.PositionY - startY;
                float rayDx = endX - startX;
                float rayDy = endY - startY;
                float projection = (tankDx * rayDx + tankDy * rayDy) / (rayDx * rayDx + rayDy * rayDy);

                if (projection >= 0 && projection <= 1)
                {
                    hitTanks.Add(targetTank);
                }
            }
        }

        foreach (var hitTank in hitTanks)
        {
            DealDamageToTankCommand.Execute(ctx, hitTank.Id, gun.Damage, tank.Id);
        }

        var projectileTrailId = GenerateId(ctx, "ptl");
        ctx.Db.projectile_trail.Insert(new ProjectileTrail
        {
            Id = projectileTrailId,
            WorldId = tank.WorldId,
            StartX = startX,
            StartY = startY,
            EndX = endX,
            EndY = endY,
            Type = Types.ProjectileTrailType.Sniper,
            SpawnedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        });
    }

    private static float PointToLineDistance(float px, float py, float x1, float y1, float x2, float y2)
    {
        float dx = x2 - x1;
        float dy = y2 - y1;
        float lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared == 0)
        {
            return (float)Math.Sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        }
        
        float t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.Max(0, Math.Min(1, t));
        
        float closestX = x1 + t * dx;
        float closestY = y1 + t * dy;
        
        return (float)Math.Sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
    }
}
