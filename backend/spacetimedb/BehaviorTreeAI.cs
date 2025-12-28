using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;
using static Module;

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
        public string WorldId;
    }

    [Reducer]
    public static void UpdateAI(ReducerContext ctx, ScheduledAIUpdate args)
    {
        var aiContext = new AIContext(ctx, args.WorldId);
        var aiTanks = ctx.Db.tank.WorldId_IsBot.Filter((args.WorldId, true)).ToList();

        foreach (var tank in aiTanks)
        {
            if (tank.Health <= 0)
            {
                var respawnedTank = RespawnTank(ctx, tank, args.WorldId, tank.Alliance);
                ctx.Db.tank.Id.Update(respawnedTank);
                continue;
            }

            Tank mutatedTank = tank;
            switch (tank.AIBehavior)
            {
                case AIBehavior.GameAI:
                    mutatedTank = GameAI.EvaluateAndMutateTank(ctx, tank, aiContext);
                    break;
                case AIBehavior.Tutorial:
                    mutatedTank = TutorialAI.EvaluateAndMutateTank(ctx, tank, aiContext);
                    break;
            }

            ctx.Db.tank.Id.Update(mutatedTank);
        }
    }
}

