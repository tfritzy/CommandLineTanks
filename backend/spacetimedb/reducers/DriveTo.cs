using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void driveTo(ReducerContext ctx, string worldId, int targetX, int targetY, float throttle)
    {
        World? maybeWorld = ctx.Db.world.Id.Find(worldId);
        if (maybeWorld != null)
        {
            var world = maybeWorld.Value;
            targetX = Math.Max(0, Math.Min(world.Width - 1, targetX));
            targetY = Math.Max(0, Math.Min(world.Height - 1, targetY));
        }

        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        if (tank.IsRepairing)
        {
            tank = tank with { IsRepairing = false };
        }

        TraversibilityMap? maybeMap = ctx.Db.traversibility_map.WorldId.Find(worldId);
        if (maybeMap == null) return;
        var traversibilityMap = maybeMap.Value;

        int startX = (int)tank.PositionX;
        int startY = (int)tank.PositionY;

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

        tank = tank with
        {
            Path = pathEntries.ToArray(),
            Velocity = new Vector2Float(0, 0)
        };

        ctx.Db.tank.Id.Update(tank);
    }
}
