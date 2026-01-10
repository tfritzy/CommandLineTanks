using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void drive(ReducerContext ctx, string gameId, int targetX, int targetY, float throttle)
    {
        World? maybeGame = ctx.Db.game.Id.Find(gameId);
        if (maybeGame != null)
        {
            var game = maybeWorld.Value;
            targetX = Math.Max(0, Math.Min(game.Width - 1, targetX));
            targetY = Math.Max(0, Math.Min(game.Height - 1, targetY));
        }

        Tank? tankQuery = ctx.Db.tank.WorldId_Owner.Filter((gameId, ctx.Sender)).FirstOrDefault();
        if (tankQuery == null || tankQuery.Value.Id == null) return;
        var tank = tankQuery.Value;
        
        var transformQuery = ctx.Db.tank_transform.TankId.Find(tank.Id);
        if (transformQuery == null) return;
        var transform = transformQuery.Value;

        if (tank.Health <= 0) return;

        TraversibilityMap? maybeMap = ctx.Db.traversibility_map.GameId.Find(gameId);
        if (maybeMap == null) return;
        var traversibilityMap = maybeMap.Value;

        int startX = (int)transform.PositionX;
        int startY = (int)transform.PositionY;

        var pathPoints = AStarPathfinding.FindPath(
            startX,
            startY,
            targetX,
            targetY,
            traversibilityMap
        );

        if (pathPoints.Count == 0)
        {
            return;
        }

        List<PathEntry> pathEntries = new List<PathEntry>();
        foreach (var point in pathPoints)
        {
            pathEntries.Add(new PathEntry
            {
                Position = new Vector2Float(point.x, point.y),
                ThrottlePercent = throttle,
                Reverse = false
            });
        }

        var newPathState = new TankPath
        {
            TankId = tank.Id,
            GameId = tank.GameId,
            Owner = tank.Owner,
            Path = pathEntries.ToArray()
        };

        UpsertTankPath(ctx, newPathState);

        var updatedTransform = transform with
        {
            Velocity = new Vector2Float(0, 0),
            UpdatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };

        ctx.Db.tank_transform.TankId.Update(updatedTransform);
    }
}
