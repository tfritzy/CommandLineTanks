using SpacetimeDB;
using static Types;
using System;
using static Module;

public static partial class TileboundAI
{
    private const int MAX_POSITION_SEARCH_ATTEMPTS = 50;
    private const int TILE_SIZE = 5;

    public static Tank EvaluateAndMutateTank(ReducerContext ctx, Tank tank, AIContext aiContext)
    {
        var pathState = aiContext.GetTankPath(tank.Id);
        bool isCurrentlyMoving = pathState != null && pathState.Value.Path.Length > 0;

        if (!isCurrentlyMoving)
        {
            var traversibilityMap = aiContext.GetTraversibilityMap();
            if (traversibilityMap != null)
            {
                var (targetX, targetY) = FindRandomPositionInTile(tank, traversibilityMap.Value, aiContext.GetRandom());
                DriveTowards(ctx, tank, targetX, targetY);
            }
        }

        return tank;
    }

    private static (int x, int y) FindRandomPositionInTile(Tank tank, Module.TraversibilityMap traversibilityMap, Random rng)
    {
        int tileMinX, tileMaxX, tileMinY, tileMaxY;

        if (tank.AiConfig.HasValue)
        {
            var config = tank.AiConfig.Value;
            tileMinX = config.PenMinX;
            tileMaxX = config.PenMaxX;
            tileMinY = config.PenMinY;
            tileMaxY = config.PenMaxY;
        }
        else
        {
            int currentX = (int)tank.PositionX;
            int currentY = (int)tank.PositionY;

            tileMinX = (currentX / TILE_SIZE) * TILE_SIZE;
            tileMinY = (currentY / TILE_SIZE) * TILE_SIZE;
            tileMaxX = Math.Min(tileMinX + TILE_SIZE - 1, traversibilityMap.Width - 1);
            tileMaxY = Math.Min(tileMinY + TILE_SIZE - 1, traversibilityMap.Height - 1);
        }

        if (tileMinX > tileMaxX || tileMinY > tileMaxY)
        {
            return ((int)tank.PositionX, (int)tank.PositionY);
        }

        for (int attempt = 0; attempt < MAX_POSITION_SEARCH_ATTEMPTS; attempt++)
        {
            int targetX = tileMinX + rng.Next(tileMaxX - tileMinX + 1);
            int targetY = tileMinY + rng.Next(tileMaxY - tileMinY + 1);

            int index = targetY * traversibilityMap.Width + targetX;
            if (index >= 0 && index < traversibilityMap.Map.Length && traversibilityMap.Map[index])
            {
                return (targetX, targetY);
            }
        }

        return ((int)tank.PositionX, (int)tank.PositionY);
    }

    private static void DriveTowards(ReducerContext ctx, Tank tank, int targetX, int targetY)
    {
        int currentX = (int)tank.PositionX;
        int currentY = (int)tank.PositionY;

        if (targetX == currentX && targetY == currentY)
        {
            return;
        }

        Vector2 currentPos = new Vector2(currentX, currentY);
        Vector2 targetPos = new Vector2(targetX, targetY);
        Vector2 offset = new Vector2(targetPos.X - currentPos.X, targetPos.Y - currentPos.Y);

        Vector2Float rootPos = new Vector2Float(tank.PositionX, tank.PositionY);
        Vector2Float nextPos = new(rootPos.X + offset.X, rootPos.Y + offset.Y);

        PathEntry entry = new()
        {
            ThrottlePercent = 1.0f,
            Position = nextPos,
            Reverse = false
        };

        var newPathState = new Module.TankPath
        {
            TankId = tank.Id,
            WorldId = tank.WorldId,
            Path = [entry]
        };

        UpsertTankPath(ctx, newPathState);

        var (direction, distance) = OffsetToDirectionAndDistance(offset.X, offset.Y);
        var updatedTank = tank with
        {
            Message = $"drive {direction} {distance}"
        };
        ctx.Db.tank.Id.Update(updatedTank);
    }

    private static (string direction, int distance) OffsetToDirectionAndDistance(int offsetX, int offsetY)
    {
        if (offsetX == 0 && offsetY == 0)
        {
            return ("north", 0);
        }

        int absX = Math.Abs(offsetX);
        int absY = Math.Abs(offsetY);

        if (absX > absY * 2)
        {
            return (offsetX > 0 ? "east" : "west", absX);
        }
        else if (absY > absX * 2)
        {
            return (offsetY > 0 ? "south" : "north", absY);
        }
        else
        {
            int distance = Math.Max(absX, absY);

            if (offsetX > 0 && offsetY < 0)
                return ("northeast", distance);
            else if (offsetX > 0 && offsetY > 0)
                return ("southeast", distance);
            else if (offsetX < 0 && offsetY > 0)
                return ("southwest", distance);
            else
                return ("northwest", distance);
        }
    }
}
