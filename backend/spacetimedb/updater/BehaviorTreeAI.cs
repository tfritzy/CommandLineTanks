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
        var aiContext = new GameAIContext(ctx, args.GameId);

        foreach (var tank in ctx.Db.tank.GameId_IsBot.Filter((args.GameId, true)))
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

                RespawnTank(ctx, tank, transform, args.GameId, tank.Alliance, false, null);
                continue;
            }

            Tank mutatedTank = tank;
            if (tank.AIBehavior == AIBehavior.GameAI)
            {
                mutatedTank = GameAI.EvaluateAndMutateTank(ctx, fullTank, aiContext);
            }

            ctx.Db.tank.Id.Update(mutatedTank);
        }

        var updatedArgs = args with { TickCount = args.TickCount + 1 };
        ctx.Db.ScheduledAIUpdate.ScheduledId.Update(updatedArgs);
    }
}
