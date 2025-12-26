using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void DriveToPosition(ReducerContext ctx, Tank tank, Vector2 offset, float throttle, bool append)
    {
        if (tank.Health <= 0) return;

        if (tank.IsRepairing)
        {
            tank = tank with { IsRepairing = false };
        }

        Vector2Float rootPos = tank.Path.Length > 0 && append ? tank.Path[^1].Position : new Vector2Float(tank.PositionX, tank.PositionY);
        Vector2Float nextPos = new(rootPos.X + offset.X, rootPos.Y + offset.Y);

        PathEntry entry = new()
        {
            ThrottlePercent = throttle,
            Position = nextPos,
            Reverse = false
        };

        if (append)
        {
            tank = tank with { Path = [.. tank.Path, entry] };
        }
        else
        {
            tank = tank with
            {
                Path = [entry],
                Velocity = new Vector2Float(0, 0)
            };
        }

        ctx.Db.tank.Id.Update(tank);
    }
}
