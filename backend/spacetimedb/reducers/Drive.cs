using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void drive(ReducerContext ctx, string worldId, Vector2 offset, float throttle, bool append)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.IsDead) return;

        Vector2 rootPos = tank.Path.Length > 0 && append ? tank.Path[^1].Position : new Vector2((int)tank.PositionX, (int)tank.PositionY);
        Vector2 nextPos = new(rootPos.X + offset.X, rootPos.Y + offset.Y);

        PathEntry entry = new()
        {
            ThrottlePercent = throttle,
            Position = nextPos,
            Reverse = false
        };

        if (append)
        {
            tank.Path = [.. tank.Path, entry];
        }
        else
        {
            tank = tank with
            {
                Path = [entry],
                Velocity = new Vector2Float(0, 0),
                BodyAngularVelocity = 0
            };
        }

        ctx.Db.tank.Id.Update(tank);
    }
}
