using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;
using static Module;
using System.Diagnostics;

public static partial class BehaviorTreeAI
{
    [Table(Scheduled = nameof(UpdateAI))]
    public partial struct ScheduledAIUpdate
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string GameId;
        public int TickCount;
    }

    [Reducer]
    public static void UpdateAI(ReducerContext ctx, ScheduledAIUpdate args)
    {
        var stopwatch = new LogStopwatch("update ai");
        var aiContext = new AIContext(ctx, args.GameId);
        var aiTanks = ctx.Db.tank.GameId_IsBot.Filter((args.GameId, true)).ToList();

        foreach (var tank in aiTanks)
        {
            var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
            if (transformQuery == null) continue;

            var transform = transformQuery.Value;
            var fullTank = new FullTank(tank, transform);

            if (tank.Health <= 0)
            {
                if (tank.DeathTimestamp == 0)
                {
                    continue;
                }

                ulong currentTimestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
                ulong timeSinceDeath = currentTimestamp - tank.DeathTimestamp;

                if (timeSinceDeath < (ulong)BOT_RESPAWN_DELAY_MICROS)
                {
                    continue;
                }

                (float, float)? spawnPosition = null;
                if (tank.AIBehavior == AIBehavior.Tilebound)
                {
                    spawnPosition = (transform.PositionX, transform.PositionY);
                }
                RespawnTank(ctx, tank, transform, args.GameId, tank.Alliance, false, spawnPosition);
                continue;
            }

            Tank mutatedTank = tank;
            switch (tank.AIBehavior)
            {
                case AIBehavior.GameAI:
                    mutatedTank = GameAI.EvaluateAndMutateTank(ctx, fullTank, aiContext);
                    break;
                case AIBehavior.Tilebound:
                    mutatedTank = TileboundAI.EvaluateAndMutateTank(ctx, fullTank, aiContext, args.TickCount);
                    break;
                case AIBehavior.RandomAim:
                    mutatedTank = RandomAimAI.EvaluateAndMutateTank(ctx, fullTank, aiContext, args.TickCount);
                    break;
                case AIBehavior.Turret:
                    mutatedTank = TurretAI.EvaluateAndMutateTank(ctx, fullTank, aiContext, args.TickCount);
                    break;
            }

            ctx.Db.tank.Id.Update(mutatedTank);
        }

        var updatedArgs = args with { TickCount = args.TickCount + 1 };
        ctx.Db.ScheduledAIUpdate.ScheduledId.Update(updatedArgs);

        stopwatch.End();
    }
}
