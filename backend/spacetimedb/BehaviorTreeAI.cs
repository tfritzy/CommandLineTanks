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

    public class AIContext
    {
        private readonly ReducerContext _ctx;
        private readonly string _worldId;
        private List<Tank>? _allTanks;
        private List<Pickup>? _allPickups;
        private TraversibilityMap? _traversibilityMap;
        private bool _traversibilityMapLoaded;

        public AIContext(ReducerContext ctx, string worldId)
        {
            _ctx = ctx;
            _worldId = worldId;
        }

        public Random GetRandom()
        {
            return _ctx.Rng;
        }

        public List<Tank> GetAllTanks()
        {
            if (_allTanks == null)
            {
                _allTanks = _ctx.Db.tank.WorldId.Filter(_worldId).ToList();
            }
            return _allTanks;
        }

        public List<Pickup> GetAllPickups()
        {
            if (_allPickups == null)
            {
                _allPickups = _ctx.Db.pickup.WorldId.Filter(_worldId).ToList();
            }
            return _allPickups;
        }

        public TraversibilityMap? GetTraversibilityMap()
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
        var botTanks = ctx.Db.tank.WorldId_IsBot.Filter((args.WorldId, true)).ToList();

        foreach (var tank in botTanks)
        {
            if (tank.Health <= 0)
            {
                var respawnedTank = RespawnTank(ctx, tank, args.WorldId, tank.Alliance);
                ctx.Db.tank.Id.Update(respawnedTank);
                continue;
            }

            var mutatedTank = EvaluateAIAndMutateTank(ctx, tank, aiContext);
            ctx.Db.tank.Id.Update(mutatedTank);
        }
    }

    public static Tank EvaluateAIAndMutateTank(ReducerContext ctx, Tank tank, AIContext aiContext)
    {
        var decision = BehaviorTreeLogic.EvaluateBehaviorTree(tank, aiContext);

        switch (decision.Action)
        {
            case BehaviorTreeLogic.AIAction.MoveTowardsPickup:
                if (decision.TargetPickup != null && decision.Path.Count > 0)
                {
                    tank = SetPath(tank, decision.Path);
                }
                break;

            case BehaviorTreeLogic.AIAction.AimAndFire:
                if (decision.TargetTank != null)
                {
                    tank = TargetTankByName(ctx, tank, decision.TargetTank.Value.Name, 0);
                    if (decision.ShouldFire)
                    {
                        tank = FireTankWeapon(ctx, tank);
                    }
                }
                break;

            case BehaviorTreeLogic.AIAction.StopMoving:
                if (decision.TargetTank != null)
                {
                    tank = tank with
                    {
                        Path = [],
                        Velocity = new Vector2Float(0, 0)
                    };

                    tank = TargetTankByName(ctx, tank, decision.TargetTank.Value.Name, 0);
                    tank = FireTankWeapon(ctx, tank);
                }
                break;

            case BehaviorTreeLogic.AIAction.MoveTowardsEnemy:
                if (decision.Path.Count > 0)
                {
                    if (decision.TargetTank != null)
                    {
                        var distanceToTarget = BehaviorTreeLogic.GetDistance(tank.PositionX, tank.PositionY, decision.TargetTank.Value.PositionX, decision.TargetTank.Value.PositionY);
                        if (distanceToTarget <= MAX_TARGETING_RANGE)
                        {
                            tank = TargetTankByName(ctx, tank, decision.TargetTank.Value.Name, 0);
                        }
                    }
                    tank = SetPath(tank, decision.Path);
                }
                break;

            case BehaviorTreeLogic.AIAction.Escape:
                tank = DriveTowards(tank, decision.TargetX, decision.TargetY);
                break;

            case BehaviorTreeLogic.AIAction.None:
                break;
        }

        return tank;
    }

    private static Tank SetPath(Tank tank, List<(int x, int y)> path)
    {
        var pathEntries = path.Select(waypoint => new PathEntry
        {
            Position = new Vector2Float(waypoint.x, waypoint.y),
            ThrottlePercent = 1.0f,
            Reverse = false
        }).ToArray();

        return tank with
        {
            Path = pathEntries,
            Velocity = new Vector2Float(0, 0)
        };
    }

    private static Tank DriveTowards(Tank tank, int targetX, int targetY)
    {
        int currentX = (int)tank.PositionX;
        int currentY = (int)tank.PositionY;

        if (targetX == currentX && targetY == currentY)
        {
            return tank;
        }

        Vector2 currentPos = new Vector2(currentX, currentY);
        Vector2 targetPos = new Vector2(targetX, targetY);
        Vector2 offset = new Vector2(targetPos.X - currentPos.X, targetPos.Y - currentPos.Y);

        Vector2Float rootPos = new Vector2Float(tank.PositionX, tank.PositionY);
        Vector2Float nextPos = new(rootPos.X + offset.X, rootPos.Y + offset.Y);

        PathEntry entry = new()
        {
            ThrottlePercent = 1.0f,
            Position = nextPos,
            Reverse = false
        };

        return tank with
        {
            Path = [entry],
            Velocity = new Vector2Float(0, 0)
        };
    }
}
