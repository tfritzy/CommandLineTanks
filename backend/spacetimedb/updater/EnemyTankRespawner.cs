using SpacetimeDB;
using static Types;

public static partial class EnemyTankRespawner
{
    private const long ENEMY_TANK_RESPAWN_CHECK_INTERVAL_MICROS = 5_000_000;

    [Table(Scheduled = nameof(CheckAndRespawnEnemyTanks))]
    public partial struct ScheduledEnemyTankRespawnCheck
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
    }

    [Reducer]
    public static void CheckAndRespawnEnemyTanks(ReducerContext ctx, ScheduledEnemyTankRespawnCheck args)
    {
        var metadatas = ctx.Db.tank_metadata.WorldId.Filter(args.WorldId);
        foreach (var metadata in metadatas)
        {
            if (metadata.Alliance == 1)
            {
                var tankQuery = ctx.Db.tank.Id.Find(metadata.TankId);
                if (tankQuery == null) continue;
                var tank = tankQuery.Value;
                
                if (tank.Health <= 0)
                {
                    if (tank.DeathTimestamp == 0)
                    {
                        continue;
                    }

                    ulong currentTimestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
                    ulong timeSinceDeath = currentTimestamp - tank.DeathTimestamp;

                    if (timeSinceDeath < (ulong)Module.BOT_RESPAWN_DELAY_MICROS)
                    {
                        continue;
                    }
                    
                    var positionQuery = ctx.Db.tank_position.TankId.Find(metadata.TankId);

                    var respawnedTank = tank with
                    {
                        Health = Module.TANK_HEALTH,
                        RemainingImmunityMicros = Module.SPAWN_IMMUNITY_DURATION_MICROS,
                        DeathTimestamp = 0
                    };
                    ctx.Db.tank.Id.Update(respawnedTank);
                    Log.Info($"Respawned enemy tank {metadata.Name} at position ({positionQuery?.PositionX ?? 0}, {positionQuery?.PositionY ?? 0})");
                }
            }
        }
    }

    public static void InitializeEnemyTankRespawner(ReducerContext ctx, string worldId)
    {
        ctx.Db.ScheduledEnemyTankRespawnCheck.Insert(new ScheduledEnemyTankRespawnCheck
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = ENEMY_TANK_RESPAWN_CHECK_INTERVAL_MICROS }),
            WorldId = worldId
        });
    }
}
