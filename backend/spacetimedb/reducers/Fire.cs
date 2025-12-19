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

        if (tank.SelectedGunIndex < 0 || tank.SelectedGunIndex >= tank.Guns.Length) return false;

        var gun = tank.Guns[tank.SelectedGunIndex];

        if (gun.Ammo != null && gun.Ammo <= 0) return false;

        if (gun.ChargeTimeSeconds != null && gun.ChargeTimeSeconds > 0)
        {
            long chargeTimeMicros = (long)(gun.ChargeTimeSeconds.Value * 1_000_000);
            ctx.Db.ScheduledChargedWeaponFire.Insert(new Module.ScheduledChargedWeaponFire
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = chargeTimeMicros }),
                TankId = tank.Id,
                TurretRotation = tank.TurretRotation,
                SelectedGunIndex = tank.SelectedGunIndex
            });

            Log.Info($"Tank {tank.Name} charging {gun.GunType}...");
            return true;
        }

        return ExecuteWeaponFire(ctx, tank, tank.TurretRotation, tank.SelectedGunIndex);
    }

    public static bool ExecuteWeaponFire(ReducerContext ctx, Tank tank, float turretRotation, int gunIndex)
    {
        if (gunIndex < 0 || gunIndex >= tank.Guns.Length) return false;

        var gun = tank.Guns[gunIndex];

        if (gun.Ammo != null && gun.Ammo <= 0) return false;

        float barrelTipX = tank.PositionX + (float)Math.Cos(turretRotation) * GUN_BARREL_LENGTH;
        float barrelTipY = tank.PositionY + (float)Math.Sin(turretRotation) * GUN_BARREL_LENGTH;

        if (gun.RaycastRange != null)
        {
            PerformRaycast(ctx, tank, barrelTipX, barrelTipY, turretRotation, gun);
        }
        else
        {
            if (gun.ProjectileCount == 1)
            {
                CreateProjectile(ctx, tank, barrelTipX, barrelTipY, turretRotation, gun);
            }
            else
            {
                float halfSpread = gun.SpreadAngle * (gun.ProjectileCount - 1) / 2.0f;
                for (int i = 0; i < gun.ProjectileCount; i++)
                {
                    float angle = turretRotation - halfSpread + (i * gun.SpreadAngle);
                    CreateProjectile(ctx, tank, barrelTipX, barrelTipY, angle, gun);
                }
            }
        }

        if (gun.Ammo != null)
        {
            var newAmmo = gun.Ammo.Value - 1;

            if (newAmmo <= 0)
            {
                tank.Guns = tank.Guns.Where((_, index) => index != gunIndex).ToArray();
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
                gun.Ammo = newAmmo;
                var updatedGuns = tank.Guns.ToArray();
                updatedGuns[gunIndex] = gun;
                tank.Guns = updatedGuns;
            }

            ctx.Db.tank.Id.Update(tank);
        }

        Log.Info($"Tank {tank.Name} fired {gun.GunType}. Ammo remaining: {gun.Ammo?.ToString() ?? "unlimited"}");
        return true;
    }

    public static void PerformRaycast(ReducerContext ctx, Tank tank, float startX, float startY, float angle, Gun gun)
    {
        float raycastRange = gun.RaycastRange.Value;

        float dirX = (float)Math.Cos(angle);
        float dirY = (float)Math.Sin(angle);

        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(tank.WorldId);
        if (traversibilityMap == null) return;

        float hitDistance = raycastRange;
        Module.Tank? hitTank = null;

        float stepSize = 0.1f;
        for (float distance = 0; distance < raycastRange; distance += stepSize)
        {
            float checkX = startX + dirX * distance;
            float checkY = startY + dirY * distance;

            int tileX = Module.GetGridPosition(checkX);
            int tileY = Module.GetGridPosition(checkY);

            if (tileX >= 0 && tileX < traversibilityMap.Value.Width &&
                tileY >= 0 && tileY < traversibilityMap.Value.Height)
            {
                int tileIndex = tileY * traversibilityMap.Value.Width + tileX;
                bool tileIsTraversable = tileIndex < traversibilityMap.Value.Map.Length && traversibilityMap.Value.Map[tileIndex];

                if (!tileIsTraversable)
                {
                    hitDistance = distance;
                    break;
                }
            }

            int collisionRegionX = Module.GetGridPosition(checkX / Module.COLLISION_REGION_SIZE);
            int collisionRegionY = Module.GetGridPosition(checkY / Module.COLLISION_REGION_SIZE);

            foreach (var targetTank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((tank.WorldId, collisionRegionX, collisionRegionY)))
            {
                if (targetTank.Alliance != tank.Alliance && targetTank.Health > 0)
                {
                    float dx = targetTank.PositionX - checkX;
                    float dy = targetTank.PositionY - checkY;
                    float distanceSquared = dx * dx + dy * dy;
                    float collisionRadiusSquared = Module.TANK_COLLISION_RADIUS * Module.TANK_COLLISION_RADIUS;

                    if (distanceSquared <= collisionRadiusSquared)
                    {
                        hitDistance = distance;
                        hitTank = targetTank;
                        break;
                    }
                }
            }

            if (hitTank != null)
            {
                break;
            }
        }

        if (hitTank != null)
        {
            var newHealth = hitTank.Value.Health - gun.Damage;
            var updatedTank = hitTank.Value with
            {
                Health = newHealth
            };
            ctx.Db.tank.Id.Update(updatedTank);

            if (newHealth <= 0)
            {
                var updatedShooterTank = tank with
                {
                    Kills = tank.Kills + 1
                };
                ctx.Db.tank.Id.Update(updatedShooterTank);

                var score = ctx.Db.score.WorldId.Find(tank.WorldId);
                if (score != null)
                {
                    var updatedScore = score.Value;
                    if (tank.Alliance >= 0 && tank.Alliance < updatedScore.Kills.Length)
                    {
                        updatedScore.Kills[tank.Alliance]++;
                        ctx.Db.score.WorldId.Update(updatedScore);

                        if (updatedScore.Kills[tank.Alliance] >= Module.KILL_LIMIT)
                        {
                            var world = ctx.Db.world.Id.Find(tank.WorldId);
                            if (world != null && world.Value.GameState == GameState.Playing)
                            {
                                var updatedWorld = world.Value with { GameState = GameState.Results };
                                ctx.Db.world.Id.Update(updatedWorld);

                                ctx.Db.ScheduledWorldReset.Insert(new ProjectileUpdater.ScheduledWorldReset
                                {
                                    ScheduledId = 0,
                                    ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = Module.WORLD_RESET_DELAY_MICROS }),
                                    WorldId = tank.WorldId
                                });

                                Log.Info($"Team {tank.Alliance} reached {Module.KILL_LIMIT} kills! Game ending in 30 seconds...");
                            }
                        }
                    }
                }
            }

            Log.Info($"Raycast weapon hit {hitTank.Value.Name} for {gun.Damage} damage at distance {hitDistance}");
        }
        else
        {
            Log.Info($"Raycast weapon missed, traveled {hitDistance} units");
        }
    }
}
