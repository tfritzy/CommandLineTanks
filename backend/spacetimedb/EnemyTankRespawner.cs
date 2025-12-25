using SpacetimeDB;
using static Types;
using System;

public static partial class EnemyTankRespawner
{
    private const long ENEMY_TANK_RESPAWN_DELAY_MICROS = 30_000_000;

    [Table(Scheduled = nameof(RespawnEnemyTank))]
    public partial struct ScheduledEnemyTankRespawn
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
        public string TankId;
    }

    [Reducer]
    public static void RespawnEnemyTank(ReducerContext ctx, ScheduledEnemyTankRespawn args)
    {
        var tank = ctx.Db.tank.Id.Find(args.TankId);
        if (tank == null) return;

        if (tank.Value.Health <= 0)
        {
            var respawnedTank = tank.Value with
            {
                Health = Module.TANK_HEALTH
            };
            ctx.Db.tank.Id.Update(respawnedTank);
            Log.Info($"Respawned enemy tank {respawnedTank.Name} at position ({respawnedTank.PositionX}, {respawnedTank.PositionY})");
        }
    }

    public static void ScheduleEnemyTankRespawn(ReducerContext ctx, string worldId, string tankId)
    {
        ctx.Db.ScheduledEnemyTankRespawn.Insert(new ScheduledEnemyTankRespawn
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.After(new TimeDuration { Microseconds = ENEMY_TANK_RESPAWN_DELAY_MICROS }),
            WorldId = worldId,
            TankId = tankId
        });
    }
}
