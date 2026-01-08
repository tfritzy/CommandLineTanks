using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;
using System.Linq;

public static partial class Module
{
    [Reducer]
    public static void drive(ReducerContext ctx, string worldId, int targetX, int targetY, float throttle)
    {
        World? maybeWorld = ctx.Db.world.Id.Find(worldId);
        if (maybeWorld != null)
        {
            var world = maybeWorld.Value;
            targetX = Math.Max(0, Math.Min(world.Width - 1, targetX));
            targetY = Math.Max(0, Math.Min(world.Height - 1, targetY));
        }

        TankMetadata? metadataQuery = ctx.Db.tank_metadata.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (metadataQuery == null || metadataQuery.Value.TankId == null) return;
        var metadata = metadataQuery.Value;
        
        var tankQuery = ctx.Db.tank.Id.Find(metadata.TankId);
        if (tankQuery == null) return;
        var tank = tankQuery.Value;
        
        var positionQuery = ctx.Db.tank_position.TankId.Find(metadata.TankId);
        if (positionQuery == null) return;
        var position = positionQuery.Value;

        if (tank.Health <= 0) return;

        TraversibilityMap? maybeMap = ctx.Db.traversibility_map.WorldId.Find(worldId);
        if (maybeMap == null) return;
        var traversibilityMap = maybeMap.Value;

        int startX = (int)position.PositionX;
        int startY = (int)position.PositionY;

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
            WorldId = tank.WorldId,
            Path = pathEntries.ToArray()
        };

        UpsertTankPath(ctx, newPathState);

        var updatedPosition = position with
        {
            Velocity = new Vector2Float(0, 0),
            UpdatedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        };

        ctx.Db.tank_position.TankId.Update(updatedPosition);
    }
}
