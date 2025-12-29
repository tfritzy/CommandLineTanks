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
        public int TickCount;
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
                (float, float)? spawnPosition = null;
                if (tank.AIBehavior == AIBehavior.Tilebound)
                {
                    spawnPosition = (tank.PositionX, tank.PositionY);
                }
                var respawnedTank = RespawnTank(ctx, tank, args.WorldId, tank.Alliance, false, spawnPosition);
                ctx.Db.tank.Id.Update(respawnedTank);
                continue;
            }

            Tank mutatedTank = tank;
            switch (tank.AIBehavior)
            {
                case AIBehavior.GameAI:
                    mutatedTank = GameAI.EvaluateAndMutateTank(ctx, tank, aiContext);
                    break;
                case AIBehavior.Tilebound:
                    mutatedTank = TileboundAI.EvaluateAndMutateTank(ctx, tank, aiContext);
                    break;
                case AIBehavior.RandomAim:
                    mutatedTank = RandomAimAI.EvaluateAndMutateTank(ctx, tank, aiContext, args.TickCount);
                    break;
                case AIBehavior.Turret:
                    mutatedTank = TurretAI.EvaluateAndMutateTank(ctx, tank, aiContext, args.TickCount);
                    break;
            }

            ctx.Db.tank.Id.Update(mutatedTank);
        }

        var updatedArgs = args with { TickCount = args.TickCount + 1 };
        ctx.Db.ScheduledAIUpdate.ScheduledId.Update(updatedArgs);
    }
}

