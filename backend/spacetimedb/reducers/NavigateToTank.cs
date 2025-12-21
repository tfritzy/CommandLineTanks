using SpacetimeDB;
using static Types;
using System.Collections.Generic;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void navigateToTank(ReducerContext ctx, string worldId, string tankName, float throttle)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        Tank? maybeTargetTank = ctx.Db.tank.WorldId_Name.Filter((worldId, tankName.ToLower())).FirstOrDefault();
        if (maybeTargetTank == null) return;
        var targetTank = maybeTargetTank.Value;

        if (targetTank.Id == tank.Id) return;

        TraversibilityMap? maybeMap = ctx.Db.traversibility_map.WorldId.Find(worldId);
        if (maybeMap == null) return;
        var traversibilityMap = maybeMap.Value;

        int startX = (int)tank.PositionX;
        int startY = (int)tank.PositionY;
        int targetX = (int)targetTank.PositionX;
        int targetY = (int)targetTank.PositionY;

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
