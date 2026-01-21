using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;
using static Module;
using System.Diagnostics;

public static partial class BehaviorTreeAI
{
    [Table(Scheduled = nameof(UpdateTankAI))]
    public partial struct ScheduledTankAIUpdate
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string GameId;
        [SpacetimeDB.Index.BTree]
        public string TankId;
        public int TickCount;
    }

    [Reducer]
    public static void UpdateTankAI(ReducerContext ctx, ScheduledTankAIUpdate args)
    {
        var tankQuery = ctx.Db.tank.Id.Find(args.TankId);
        if (tankQuery == null)
        {
            ctx.Db.ScheduledTankAIUpdate.ScheduledId.Delete(args.ScheduledId);
            return;
        }

        var tank = tankQuery.Value;
        var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
        if (transformQuery == null)
        {
            ctx.Db.ScheduledTankAIUpdate.ScheduledId.Delete(args.ScheduledId);
            return;
        }

        var transform = transformQuery.Value;
        var fullTank = new FullTank(tank, transform);
        var aiContext = new GameAIContext(ctx, args.GameId);

        if (tank.Health <= 0)
        {
            if (tank.DeathTimestamp == 0)
            {
                RescheduleAIUpdate(ctx, args);
                return;
            }

            ulong currentTimestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
            ulong timeSinceDeath = currentTimestamp - tank.DeathTimestamp;

            if (timeSinceDeath < (ulong)BOT_RESPAWN_DELAY_MICROS)
            {
                RescheduleAIUpdate(ctx, args);
                return;
            }

            RespawnTank.Call(ctx, tank, transform, args.GameId, tank.Alliance, false, null);
            RescheduleAIUpdate(ctx, args);
            return;
        }

        Tank mutatedTank = tank;
        if (tank.AIBehavior == AIBehavior.GameAI)
        {
            mutatedTank = GameAI.EvaluateAndMutateTank(ctx, fullTank, aiContext, args.TickCount);
        }

        ctx.Db.tank.Id.Update(mutatedTank);
        RescheduleAIUpdate(ctx, args);

        GC.Collect();
    }

    private static void RescheduleAIUpdate(ReducerContext ctx, ScheduledTankAIUpdate args)
    {
        long nextUpdateMicros = ctx.Rng.Next(2_000_000, 3_500_000);
        var updatedArgs = args with 
        { 
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = nextUpdateMicros }),
            TickCount = args.TickCount + 1 
        };
        ctx.Db.ScheduledTankAIUpdate.Insert(updatedArgs);
    }

    public static void ScheduleTankAIUpdate(ReducerContext ctx, string gameId, string tankId)
    {
        if (ctx.Db.ScheduledTankAIUpdate.TankId.Filter(tankId).Any())
        {
            return;
        }

        long initialDelayMicros = ctx.Rng.Next(2_000_000, 4_000_000);
        ctx.Db.ScheduledTankAIUpdate.Insert(new ScheduledTankAIUpdate
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = initialDelayMicros }),
            GameId = gameId,
            TankId = tankId,
            TickCount = 0
        });
    }

    public static void CancelTankAIUpdate(ReducerContext ctx, string tankId)
    {
        foreach (var scheduledUpdate in ctx.Db.ScheduledTankAIUpdate.TankId.Filter(tankId))
        {
            ctx.Db.ScheduledTankAIUpdate.ScheduledId.Delete(scheduledUpdate.ScheduledId);
        }
    }
}
