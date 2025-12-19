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

        float endX = startX + dirX * raycastRange;
        float endY = startY + dirY * raycastRange;

        int startRegionX = Module.GetGridPosition(startX / Module.COLLISION_REGION_SIZE);
        int startRegionY = Module.GetGridPosition(startY / Module.COLLISION_REGION_SIZE);
        int endRegionX = Module.GetGridPosition(endX / Module.COLLISION_REGION_SIZE);
        int endRegionY = Module.GetGridPosition(endY / Module.COLLISION_REGION_SIZE);

        int minRegionX = Math.Min(startRegionX, endRegionX);
        int maxRegionX = Math.Max(startRegionX, endRegionX);
        int minRegionY = Math.Min(startRegionY, endRegionY);
        int maxRegionY = Math.Max(startRegionY, endRegionY);

        var hitTanks = new List<(Module.Tank tank, float distance)>();
        var processedTankIds = new HashSet<string>();

        for (int regionX = minRegionX; regionX <= maxRegionX; regionX++)
        {
            for (int regionY = minRegionY; regionY <= maxRegionY; regionY++)
            {
                foreach (var targetTank in ctx.Db.tank.WorldId_CollisionRegionX_CollisionRegionY.Filter((tank.WorldId, regionX, regionY)))
                {
                    if (targetTank.Alliance != tank.Alliance && targetTank.Health > 0 && !processedTankIds.Contains(targetTank.Id))
                    {
                        processedTankIds.Add(targetTank.Id);

                        float dx = targetTank.PositionX - startX;
                        float dy = targetTank.PositionY - startY;
                        float projectionLength = dx * dirX + dy * dirY;

                        if (projectionLength >= 0 && projectionLength <= raycastRange)
                        {
                            float perpX = dx - dirX * projectionLength;
                            float perpY = dy - dirY * projectionLength;
                            float perpDistanceSquared = perpX * perpX + perpY * perpY;

                            if (perpDistanceSquared <= Module.TANK_COLLISION_RADIUS * Module.TANK_COLLISION_RADIUS)
                            {
                                hitTanks.Add((targetTank, projectionLength));
                            }
                        }
                    }
                }
            }
        }

        hitTanks.Sort((a, b) => a.distance.CompareTo(b.distance));

        int collisionCount = 0;
        float hitDistance = raycastRange;
        bool hitTerrain = false;

        float stepSize = 0.5f;
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
                    hitTerrain = true;
                    break;
                }
            }
        }

        int tanksHit = 0;
        foreach (var (hitTank, distance) in hitTanks)
        {
            if (distance >= hitDistance)
                break;

            if (collisionCount >= gun.MaxCollisions)
                break;

            var newHealth = hitTank.Health - gun.Damage;
            var updatedTank = hitTank with
            {
                Health = newHealth
            };
            ctx.Db.tank.Id.Update(updatedTank);
            collisionCount++;
            tanksHit++;

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

            Log.Info($"Raycast weapon hit {hitTank.Name} for {gun.Damage} damage at distance {distance}");
        }

        if (tanksHit == 0)
        {
            if (hitTerrain)
            {
                Log.Info($"Raycast weapon hit terrain at {hitDistance} units");
            }
            else
            {
                Log.Info($"Raycast weapon missed, traveled {raycastRange} units");
            }
        }
        else
        {
            Log.Info($"Raycast weapon hit {tanksHit} tank(s)");
        }
    }
}
