using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void DriveToPosition(ReducerContext ctx, Tank tank, Vector2 offset, float throttle, bool append)
    {
        if (tank.Health <= 0) return;

        var pathState = ctx.Db.tank_path.TankId.Find(tank.Id);
        PathEntry[] currentPath = pathState?.Path ?? [];

        Vector2Float rootPos = currentPath.Length > 0 && append ? currentPath[^1].Position : new Vector2Float(tank.PositionX, tank.PositionY);
        Vector2Float nextPos = new(rootPos.X + offset.X, rootPos.Y + offset.Y);

        PathEntry entry = new()
        {
            ThrottlePercent = throttle,
            Position = nextPos,
            Reverse = false
        };

        PathEntry[] newPath;
        if (append)
        {
            newPath = [.. currentPath, entry];
        }
        else
        {
            newPath = [entry];
            tank = tank with
            {
                Velocity = new Vector2Float(0, 0)
            };
            ctx.Db.tank.Id.Update(tank);
        }

        var newPathState = new TankPath
        {
            TankId = tank.Id,
            WorldId = tank.WorldId,
            Path = newPath
        };

        if (pathState != null)
        {
            ctx.Db.tank_path.TankId.Update(newPathState);
        }
        else
        {
            ctx.Db.tank_path.Insert(newPathState);
        }
    }
}
