using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;
using static Module;

public static partial class GameAI
{
    public static Tank EvaluateAndMutateTank(ReducerContext ctx, FullTank fullTank, GameAIContext aiContext, ulong tickCount)
    {
        var tank = fullTank.Tank;
        bool canFireThisTick = BehaviorTreeAI.CanBotFireOnTick(tank.Id, tickCount);
        var decision = GameAILogic.EvaluateBehaviorTree(ctx, fullTank, aiContext, canFireThisTick);

        switch (decision.Action)
        {
            case GameAILogic.AIAction.MoveTowardsPickup:
                if (decision.TargetPickup != null && decision.Path.Count > 0)
                {
                    SetPath(ctx, fullTank, decision.Path);
                }
                break;

            case GameAILogic.AIAction.AimAndFire:
                if (decision.TargetTank != null)
                {
                    tank = TargetTankByCode.Call(ctx, tank, decision.TargetTank.Value.TargetCode);
                    if (decision.ShouldFire)
                    {
                        tank = FireTankWeapon.Call(ctx, tank);
                    }
                }
                break;

            case GameAILogic.AIAction.StopMoving:
                if (decision.TargetTank != null)
                {
                    DeleteTankPath.Call(ctx, tank.Id);

                    var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
                    if (transformQuery != null)
                    {
                        var updatedTransform = transformQuery.Value with { Velocity = new Vector2Float(0, 0) };
                        ctx.Db.tank_transform.TankId.Update(updatedTransform);
                    }

                    tank = TargetTankByCode.Call(ctx, tank, decision.TargetTank.Value.TargetCode);
                    tank = FireTankWeapon.Call(ctx, tank);
                }
                break;

            case GameAILogic.AIAction.MoveTowardsEnemy:
                if (decision.Path.Count > 0)
                {
                    if (decision.TargetTank != null)
                    {
                        var distanceToTarget = GameAILogic.GetDistance(fullTank.PositionX, fullTank.PositionY, decision.TargetTank.Value.PositionX, decision.TargetTank.Value.PositionY);
                        if (distanceToTarget <= MAX_TARGETING_RANGE)
                        {
                            tank = TargetTankByCode.Call(ctx, tank, decision.TargetTank.Value.TargetCode);
                        }
                    }
                    SetPath(ctx, fullTank, decision.Path);
                }
                break;

            case GameAILogic.AIAction.Escape:
                DriveTowards(ctx, fullTank, decision.TargetX, decision.TargetY);
                break;

            case GameAILogic.AIAction.None:
                break;
        }

        return tank;
    }

    private static void SetPath(ReducerContext ctx, FullTank fullTank, List<(int x, int y)> path)
    {
        var pathEntries = new Vector2Float[path.Count];
        for (int i = 0; i < path.Count; i++)
        {
            pathEntries[i] = new Vector2Float(path[i].x, path[i].y);
        }

        var newPathState = new Module.TankPath
        {
            TankId = fullTank.Id,
            GameId = fullTank.GameId,
            Owner = fullTank.Owner,
            Path = pathEntries
        };

        UpsertTankPath.Call(ctx, newPathState);
    }

    private static void DriveTowards(ReducerContext ctx, FullTank fullTank, int targetX, int targetY)
    {
        int currentX = (int)fullTank.PositionX;
        int currentY = (int)fullTank.PositionY;

        if (targetX == currentX && targetY == currentY)
        {
            return;
        }

        Vector2 currentPos = new Vector2(currentX, currentY);
        Vector2 targetPos = new Vector2(targetX, targetY);
        Vector2 offset = new Vector2(targetPos.X - currentPos.X, targetPos.Y - currentPos.Y);

        Vector2Float rootPos = new Vector2Float(fullTank.PositionX, fullTank.PositionY);
        Vector2Float nextPos = new(rootPos.X + offset.X, rootPos.Y + offset.Y);

        var newPathState = new Module.TankPath
        {
            TankId = fullTank.Id,
            GameId = fullTank.GameId,
            Owner = fullTank.Owner,
            Path = [nextPos]
        };

        UpsertTankPath.Call(ctx, newPathState);
    }
}
