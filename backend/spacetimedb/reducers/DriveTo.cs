using SpacetimeDB;
using static Types;
using System.Collections.Generic;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void driveTo(ReducerContext ctx, string worldId, int targetX, int targetY, float throttle)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        TraversibilityMap? maybeMap = ctx.Db.traversibility_map.WorldId.Filter(worldId).FirstOrDefault();
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
                Position = new Vector2(point.x, point.y),
                ThrottlePercent = throttle,
                Reverse = false
            });
        }

        tank = tank with
        {
            Path = pathEntries.ToArray(),
            Velocity = new Vector2Float(0, 0),
            BodyAngularVelocity = 0
        };

        ctx.Db.tank.Id.Update(tank);
    }
}
