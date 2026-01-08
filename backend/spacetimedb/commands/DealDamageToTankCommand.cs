using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    public static void DealDamageToTankCommand(
        ReducerContext ctx,
        Tank tank,
        TankMetadata metadata,
        TankPosition position,
        int damage,
        string shooterTankId,
        int attackerAlliance,
        string worldId)
    {
        if (tank.RemainingImmunityMicros > 0)
        {
            return;
        }

        var shooterMetadata = ctx.Db.tank_metadata.TankId.Find(shooterTankId);
        var shooterIdentity = shooterMetadata?.Owner;

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
                DeathTimestamp = metadata.IsBot ? (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch : 0,
                LastDamagedBy = shooterIdentity
            };
            ctx.Db.tank.Id.Update(killedTank);

            DropWeaponsOnDeath(ctx, tank, position, worldId);

            if (shooterMetadata != null)
            {
                var shooterTank = ctx.Db.tank.Id.Find(shooterTankId);
                if (shooterTank != null)
                {
                    var updatedShooterTank = shooterTank.Value with
                    {
                        Kills = shooterTank.Value.Kills + 1,
                        KillStreak = shooterTank.Value.KillStreak + 1
                    };
                    ctx.Db.tank.Id.Update(updatedShooterTank);

                    var killeeName = metadata.IsBot ? $"[Bot] {metadata.Name}" : metadata.Name;
                    ctx.Db.kills.Insert(new Kill
                    {
                        Id = GenerateId(ctx, "k"),
                        WorldId = worldId,
                        Killer = shooterMetadata.Value.Owner,
                        KilleeName = killeeName,
                        Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
                    });
                }
            }

            var score = ctx.Db.score.WorldId.Find(worldId);
            if (score != null)
            {
                var updatedScore = score.Value;
                if (attackerAlliance >= 0 && attackerAlliance < updatedScore.Kills.Length)
                {
                    updatedScore.Kills[attackerAlliance]++;
                    ctx.Db.score.WorldId.Update(updatedScore);
                }
            }
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

    private static void DropWeaponsOnDeath(ReducerContext ctx, Tank tank, TankPosition position, string worldId)
    {
        foreach (var gun in tank.Guns)
        {
            if (gun.GunType == GunType.Base)
            {
                continue;
            }

            var pickupType = PickupSpawner.GetPickupTypeForGun(gun.GunType);
            if (pickupType == null)
            {
                continue;
            }

            float offsetX = ((float)ctx.Rng.NextDouble() - 0.5f) * 1.5f;
            float offsetY = ((float)ctx.Rng.NextDouble() - 0.5f) * 1.5f;

            float dropX = position.PositionX + offsetX;
            float dropY = position.PositionY + offsetY;

            int gridX = (int)Math.Floor(dropX);
            int gridY = (int)Math.Floor(dropY);

            ctx.Db.pickup.Insert(Pickup.Build(
                ctx: ctx,
                worldId: worldId,
                positionX: dropX,
                positionY: dropY,
                gridX: gridX,
                gridY: gridY,
                type: pickupType.Value,
                ammo: gun.Ammo
            ));
        }
    }
}
