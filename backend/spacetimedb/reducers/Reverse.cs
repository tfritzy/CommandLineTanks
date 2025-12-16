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

        Vector2 rootPos = new Vector2((int)tank.PositionX, (int)tank.PositionY);

        float angle = tank.BodyRotation;
        int offsetX = (int)Math.Round(-Math.Cos(angle) * distance);
        int offsetY = (int)Math.Round(Math.Sin(angle) * distance);

        Vector2 nextPos = new(rootPos.X + offsetX, rootPos.Y + offsetY);
        Log.Info(tank + " reversing to " + nextPos + ". because " + rootPos + " and offset (" + offsetX + ", " + offsetY + ")");

        PathEntry entry = new()
        {
            ThrottlePercent = 1.0f,
            Position = nextPos,
            Reverse = true
        };

        tank = tank with
        {
            Path = [entry],
            Velocity = new Vector2Float(0, 0),
            BodyAngularVelocity = 0
        };

        ctx.Db.tank.Id.Update(tank);
    }
}
