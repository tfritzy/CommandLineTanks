using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    public static void DealDamageToTankCommand(
        ReducerContext ctx,
        Tank tank,
        TankTransform transform,
        int damage,
        string shooterTankId,
        int attackerAlliance,
        string gameId,
        TraversibilityMap traversibilityMap)
    {
        if (tank.RemainingImmunityMicros > 0)
        {
            return;
        }

        var shooterTankQuery = ctx.Db.tank.Id.Find(shooterTankId);
        var shooterIdentity = shooterTankQuery?.Owner;

        if (tank.HasShield)
        {
            var tankWithoutShield = tank with 
            { 
                HasShield = false,
                LastDamagedBy = shooterIdentity
            };
            ctx.Db.tank.Id.Update(tankWithoutShield);
            return;
        }

        var newHealth = tank.Health - damage;

        if (newHealth <= 0)
        {
            DeleteTankPathIfExists(ctx, tank.Id);

            var killedTank = tank with
            {
                Health = newHealth,
                Deaths = tank.Deaths + 1,
                KillStreak = 0,
                DeathTimestamp = tank.IsBot ? (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch : 0,
                LastDamagedBy = shooterIdentity
            };
            ctx.Db.tank.Id.Update(killedTank);

            DropWeaponsOnDeath(ctx, tank, transform, gameId, traversibilityMap);

            if (shooterTankQuery != null)
            {
                var updatedShooterTank = shooterTankQuery.Value with
                {
                    Kills = shooterTankQuery.Value.Kills + 1,
                    KillStreak = shooterTankQuery.Value.KillStreak + 1
                };
                ctx.Db.tank.Id.Update(updatedShooterTank);

                var killeeName = tank.Name;
                ctx.Db.kills.Insert(new Kill
                {
                    Id = GenerateId(ctx, "k"),
                    GameId = gameId,
                    Killer = shooterTankQuery.Value.Owner,
                    KilleeName = killeeName,
                    Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
                });

                var shooterColor = GetAllianceColor(shooterTankQuery.Value.Alliance);
                var killeeColor = GetAllianceColor(tank.Alliance);
                var shooterName = shooterTankQuery.Value.Name;
                var coloredShooterName = $"[color={shooterColor}]{shooterName}[/color]";
                var coloredKilleeName = $"[color={killeeColor}]{killeeName}[/color]";
                
                ctx.Db.message.Insert(new Message
                {
                    Id = GenerateId(ctx, "msg"),
                    GameId = gameId,
                    Sender = "System",
                    SenderIdentity = null,
                    Text = $"{coloredShooterName} killed {coloredKilleeName}",
                    Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
                });
            }

            var score = ctx.Db.score.GameId.Find(gameId);
            if (score != null)
            {
                var updatedScore = score.Value;
                if (attackerAlliance >= 0 && attackerAlliance < updatedScore.Kills.Length)
                {
                    updatedScore.Kills[attackerAlliance]++;
                    ctx.Db.score.GameId.Update(updatedScore);
                }
            }

            MaybeAdvanceTutorialOnKill(ctx, gameId, killedTank);
        }
        else
        {
            var updatedTank = tank with
            {
                Health = newHealth,
                LastDamagedBy = shooterIdentity
            };
            ctx.Db.tank.Id.Update(updatedTank);
        }
    }

    private static void DropWeaponsOnDeath(ReducerContext ctx, Tank tank, TankTransform transform, string gameId, TraversibilityMap traversibilityMap)
    {
        foreach (var tankGun in ctx.Db.tank_gun.TankId.Filter(tank.Id))
        {
            var gun = tankGun.Gun;

            var pickupType = PickupSpawner.GetPickupTypeForGun(gun.GunType);
            if (pickupType == null)
            {
                continue;
            }

            float offsetX = ((float)ctx.Rng.NextDouble() - 0.5f) * 1.5f;
            float offsetY = ((float)ctx.Rng.NextDouble() - 0.5f) * 1.5f;

            float dropX = transform.PositionX + offsetX;
            float dropY = transform.PositionY + offsetY;

            int initialGridX = (int)Math.Floor(dropX);
            int initialGridY = (int)Math.Floor(dropY);

            var (finalGridX, finalGridY) = FindNearestTraversableTile(
                ctx,
                traversibilityMap,
                initialGridX,
                initialGridY
            );

            if (finalGridX < 0 || finalGridY < 0)
            {
                continue;
            }

            float centerX = finalGridX + 0.5f;
            float centerY = finalGridY + 0.5f;

            ctx.Db.pickup.Insert(Pickup.Build(
                ctx: ctx,
                gameId: gameId,
                positionX: centerX,
                positionY: centerY,
                gridX: finalGridX,
                gridY: finalGridY,
                type: pickupType.Value,
                ammo: gun.Ammo
            ));
        }
    }

    private static (int gridX, int gridY) FindNearestTraversableTile(
        ReducerContext ctx,
        TraversibilityMap traversibilityMap,
        int startX,
        int startY)
    {
        if (startX >= 0 && startX < traversibilityMap.Width &&
            startY >= 0 && startY < traversibilityMap.Height)
        {
            int startIndex = startY * traversibilityMap.Width + startX;
            if (startIndex < traversibilityMap.Map.Length * 8 && traversibilityMap.IsTraversable(startIndex))
            {
                return (startX, startY);
            }
        }

        int maxSearchRadius = 10;
        for (int radius = 1; radius <= maxSearchRadius; radius++)
        {
            for (int dx = -radius; dx <= radius; dx++)
            {
                for (int dy = -radius; dy <= radius; dy++)
                {
                    if (Math.Abs(dx) != radius && Math.Abs(dy) != radius)
                    {
                        continue;
                    }

                    int checkX = startX + dx;
                    int checkY = startY + dy;

                    if (checkX < 0 || checkX >= traversibilityMap.Width ||
                        checkY < 0 || checkY >= traversibilityMap.Height)
                    {
                        continue;
                    }

                    int tileIndex = checkY * traversibilityMap.Width + checkX;
                    if (tileIndex < traversibilityMap.Map.Length * 8 && traversibilityMap.IsTraversable(tileIndex))
                    {
                        return (checkX, checkY);
                    }
                }
            }
        }

        return (-1, -1);
    }

    private static string GetAllianceColor(int alliance)
    {
        return alliance == 0 ? "#ff5555" : "#7fbbdc";
    }
}
