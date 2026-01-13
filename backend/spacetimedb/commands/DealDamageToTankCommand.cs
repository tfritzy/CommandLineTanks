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
        string gameId)
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

            DropWeaponsOnDeath(ctx, tank, transform, gameId);

            if (shooterTankQuery != null)
            {
                var updatedShooterTank = shooterTankQuery.Value with
                {
                    Kills = shooterTankQuery.Value.Kills + 1,
                    KillStreak = shooterTankQuery.Value.KillStreak + 1
                };
                ctx.Db.tank.Id.Update(updatedShooterTank);

                var killeeName = tank.IsBot ? $"[Bot] {tank.Name}" : tank.Name;
                ctx.Db.kills.Insert(new Kill
                {
                    Id = GenerateId(ctx, "k"),
                    GameId = gameId,
                    Killer = shooterTankQuery.Value.Owner,
                    KilleeName = killeeName,
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

    private static void DropWeaponsOnDeath(ReducerContext ctx, Tank tank, TankTransform transform, string gameId)
    {
        var guns = GetTankGuns(ctx, tank.Id);
        foreach (var gun in guns)
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

            float dropX = transform.PositionX + offsetX;
            float dropY = transform.PositionY + offsetY;

            int gridX = (int)Math.Floor(dropX);
            int gridY = (int)Math.Floor(dropY);

            ctx.Db.pickup.Insert(Pickup.Build(
                ctx: ctx,
                gameId: gameId,
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
