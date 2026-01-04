using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void DealDamageToTankCommand(
        ReducerContext ctx,
        Tank tank,
        int damage,
        string shooterTankId,
        int attackerAlliance,
        string worldId)
    {
        if (tank.RemainingImmunityMicros > 0)
        {
            return;
        }

        if (tank.HasShield)
        {
            var tankWithoutShield = tank with { HasShield = false };
            ctx.Db.tank.Id.Update(tankWithoutShield);
            return;
        }

        if (tank.IsRepairing)
        {
            tank = tank with { IsRepairing = false, Message = "Repair interrupted" };
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
                DeathTimestamp = tank.IsBot ? (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch : 0
            };
            ctx.Db.tank.Id.Update(killedTank);

            var shooterTank = ctx.Db.tank.Id.Find(shooterTankId);
            if (shooterTank != null)
            {
                var updatedShooterTank = shooterTank.Value with
                {
                    Kills = shooterTank.Value.Kills + 1,
                    KillStreak = shooterTank.Value.KillStreak + 1
                };
                ctx.Db.tank.Id.Update(updatedShooterTank);

                var killeeName = tank.IsBot ? $"[Bot] {tank.Name}" : tank.Name;
                ctx.Db.kills.Insert(new Kill
                {
                    Id = GenerateId(ctx, "k"),
                    WorldId = worldId,
                    Killer = shooterTank.Value.Owner,
                    KilleeName = killeeName,
                    Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
                });
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
                Health = newHealth
            };
            ctx.Db.tank.Id.Update(updatedTank);
        }
    }
}
