using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;
using static Module;
using System.Diagnostics;

public static partial class BehaviorTreeAI
{
    public const long AI_UPDATE_INTERVAL_MICROS = 750_000;

    public static bool CanBotFireOnTick(string tankId, int tickCount)
    {
        int hash = 0;
        foreach (char c in tankId)
        {
            hash = ((hash << 5) - hash) + c;
        }
        int fireSlot = Math.Abs(hash) % 3;
        return (tickCount % 3) == fireSlot;
    }

    [Table(Scheduled = nameof(UpdateTankAI))]
    public partial struct ScheduledTankAIUpdate
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
    public static void UpdateTankAI(ReducerContext ctx, ScheduledTankAIUpdate args)
    {
        var game = ctx.Db.game.Id.Find(args.GameId);
        if (game == null)
        {
            return;
        }

        int currentTick = args.TickCount + 1;

        var aiContext = new GameAIContext(ctx, args.GameId);

        foreach (var tank in ctx.Db.tank.GameId.Filter(args.GameId))
        {
            if (!tank.IsBot)
            {
                continue;
            }

            var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
            if (transformQuery == null)
            {
                continue;
            }

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

                RespawnTank.Call(ctx, tank, transform, args.GameId, tank.Alliance, false, null);
                continue;
            }

            Tank mutatedTank = tank;
            if (tank.AIBehavior == AIBehavior.GameAI)
            {
                mutatedTank = GameAI.EvaluateAndMutateTank(ctx, fullTank, aiContext, currentTick);
            }

            ctx.Db.tank.Id.Update(mutatedTank);
        }

        GC.Collect();
    }
}
