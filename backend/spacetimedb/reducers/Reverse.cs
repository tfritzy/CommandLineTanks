using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    [Reducer]
    public static void reverse(ReducerContext ctx, string worldId, float distance)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        if (tank.IsRepairing)
        {
            tank = tank with { IsRepairing = false };
        }

        Vector2 rootPos = new Vector2((int)tank.PositionX, (int)tank.PositionY);

        int offsetX, offsetY;
        if (tank.Velocity.X != 0 || tank.Velocity.Y != 0)
        {
            var velocityMagnitude = Math.Sqrt(tank.Velocity.X * tank.Velocity.X + tank.Velocity.Y * tank.Velocity.Y);
            offsetX = (int)Math.Round(-(tank.Velocity.X / velocityMagnitude) * distance);
            offsetY = (int)Math.Round(-(tank.Velocity.Y / velocityMagnitude) * distance);
        }
        else
        {
            offsetX = 0;
            offsetY = (int)Math.Round(-distance);
        }

        Vector2Float nextPos = new(rootPos.X + offsetX, rootPos.Y + offsetY);
        Log.Info(tank + " reversing to " + nextPos + ". because " + rootPos + " and offset (" + offsetX + ", " + offsetY + ")");

        PathEntry entry = new()
        {
            ThrottlePercent = 1.0f,
            Position = nextPos,
            Reverse = false
        };

        tank = tank with
        {
            Path = [entry],
            Velocity = new Vector2Float(0, 0)
        };

        ctx.Db.tank.Id.Update(tank);
    }
}
