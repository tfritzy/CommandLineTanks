using SpacetimeDB;
using static Types;

public static partial class EnemyTankRespawner
{
    private const long ENEMY_TANK_RESPAWN_CHECK_INTERVAL_MICROS = 30_000_000;

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
        var tanks = ctx.Db.tank.WorldId.Filter(args.WorldId);
        foreach (var tank in tanks)
        {
            if (tank.Alliance == 1 && tank.Health <= 0)
            {
                var respawnedTank = tank with
                {
                    Health = Module.TANK_HEALTH
                };
                ctx.Db.tank.Id.Update(respawnedTank);
                Log.Info($"Respawned enemy tank {respawnedTank.Name} at position ({respawnedTank.PositionX}, {respawnedTank.PositionY})");
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
