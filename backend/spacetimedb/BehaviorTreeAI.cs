using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;

public static partial class BehaviorTreeAI
{
    [Table(Scheduled = nameof(UpdateAI))]
    public partial struct ScheduledAIUpdate
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        public string WorldId;
    }

    public class AIContext
    {
        private readonly ReducerContext _ctx;
        private readonly string _worldId;
        private List<Module.Tank>? _allTanks;
        private List<Module.Pickup>? _allPickups;
        private Module.TraversibilityMap? _traversibilityMap;
        private bool _traversibilityMapLoaded;

        public AIContext(ReducerContext ctx, string worldId)
        {
            _ctx = ctx;
            _worldId = worldId;
        }

        public List<Module.Tank> GetAllTanks()
        {
            if (_allTanks == null)
            {
                _allTanks = _ctx.Db.tank.WorldId.Filter(_worldId).ToList();
            }
            return _allTanks;
        }

        public List<Module.Pickup> GetAllPickups()
        {
            if (_allPickups == null)
            {
                _allPickups = _ctx.Db.pickup.WorldId.Filter(_worldId).ToList();
            }
            return _allPickups;
        }

        public Module.TraversibilityMap? GetTraversibilityMap()
        {
            if (!_traversibilityMapLoaded)
            {
                _traversibilityMap = _ctx.Db.traversibility_map.WorldId.Find(_worldId);
                _traversibilityMapLoaded = true;
            }
            return _traversibilityMap;
        }
    }

    [Reducer]
    public static void UpdateAI(ReducerContext ctx, ScheduledAIUpdate args)
    {
        var aiContext = new AIContext(ctx, args.WorldId);

        foreach (var tank in ctx.Db.tank.WorldId_IsBot.Filter((args.WorldId, true)))
        {
            if (tank.IsDead)
            {
                var respawnedTank = Module.RespawnTank(ctx, tank, args.WorldId, tank.Alliance);
                ctx.Db.tank.Id.Update(respawnedTank);
                continue;
            }

            EvaluateBehaviorTree(ctx, tank, aiContext);
        }

        ctx.Db.ScheduledAIUpdate.ScheduledId.Update(args with
        {
            ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = 1_000_000 })
        });
    }

    private static void EvaluateBehaviorTree(ReducerContext ctx, Module.Tank tank, AIContext aiContext)
    {
        var decision = BehaviorTreeLogic.EvaluateBehaviorTree(tank, aiContext);

        switch (decision.Action)
        {
            case BehaviorTreeLogic.AIAction.MoveTowardsPickup:
                if (decision.TargetPickup != null)
                {
                    MoveTowardsPickup(ctx, tank, decision.TargetPickup.Value);
                }
                break;

            case BehaviorTreeLogic.AIAction.AimAndFire:
                if (decision.TargetTank != null)
                {
                    AimAndFire(ctx, tank, decision.TargetTank.Value, decision.AimAngle, decision.ShouldFire);
                }
                break;

            case BehaviorTreeLogic.AIAction.MoveTowardsEnemySpawn:
                SetMovementPath(ctx, tank, decision.TargetX, decision.TargetY);
                break;

            case BehaviorTreeLogic.AIAction.None:
                break;
        }
    }

    private static void AimAndFire(ReducerContext ctx, Module.Tank tank, Module.Tank target, float aimAngle, bool shouldFire)
    {
        var updatedTank = tank with
        {
            Target = target.Id,
            TargetLead = 0.5f,
            TargetTurretRotation = aimAngle
        };
        ctx.Db.tank.Id.Update(updatedTank);

        if (shouldFire)
        {
            Module.FireTankWeapon(ctx, updatedTank);
        }
    }

    private static void MoveTowardsPickup(ReducerContext ctx, Module.Tank tank, Module.Pickup pickup)
    {
        SetMovementPath(ctx, tank, pickup.PositionX, pickup.PositionY);
    }

    private static void SetMovementPath(ReducerContext ctx, Module.Tank tank, int targetX, int targetY)
    {
        var entry = new PathEntry
        {
            Position = new Vector2(targetX, targetY),
            ThrottlePercent = 1.0f,
            Reverse = false
        };

        var updatedTank = tank with
        {
            Path = [entry],
            Velocity = new Vector2Float(0, 0),
            BodyAngularVelocity = 0
        };

        ctx.Db.tank.Id.Update(updatedTank);
    }
}
