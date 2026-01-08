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
        var aiMetadata = ctx.Db.tank_metadata.WorldId_IsBot.Filter((args.WorldId, true)).ToList();

        foreach (var metadata in aiMetadata)
        {
            var tankQuery = ctx.Db.tank.Id.Find(metadata.TankId);
            var positionQuery = ctx.Db.tank_position.TankId.Find(metadata.TankId);
            if (tankQuery == null || positionQuery == null) continue;
            
            var tank = tankQuery.Value;
            var position = positionQuery.Value;
            var fullTank = new FullTank(tank, metadata, position);

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
                if (metadata.AIBehavior == AIBehavior.Tilebound)
                {
                    spawnPosition = (position.PositionX, position.PositionY);
                }
                RespawnTank(ctx, tank, metadata, position, args.WorldId, metadata.Alliance, false, spawnPosition);
                continue;
            }

            Tank mutatedTank = tank;
            switch (metadata.AIBehavior)
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
    }
}
