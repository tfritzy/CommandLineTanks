using SpacetimeDB;
using static Types;
using System;
using static Module;

public static partial class TileboundAI
{
    private const int MAX_POSITION_SEARCH_ATTEMPTS = 50;
    private const int TILE_SIZE = 6;

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
        int currentX = (int)tank.PositionX;
        int currentY = (int)tank.PositionY;

        int tileMinX = (currentX / TILE_SIZE) * TILE_SIZE;
        int tileMinY = (currentY / TILE_SIZE) * TILE_SIZE;
        int tileMaxX = Math.Min(tileMinX + TILE_SIZE - 1, traversibilityMap.Width - 1);
        int tileMaxY = Math.Min(tileMinY + TILE_SIZE - 1, traversibilityMap.Height - 1);

        if (tileMinX > tileMaxX || tileMinY > tileMaxY)
        {
            return (currentX, currentY);
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

        return (currentX, currentY);
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
    }
}
