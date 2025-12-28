using SpacetimeDB;
using static Types;
using System;
using static Module;

public static partial class TutorialAI
{
    private const int MAX_POSITION_SEARCH_ATTEMPTS = 50;
    private const int TUTORIAL_MOVEMENT_SQUARE_SIZE = 6;

    public static Tank EvaluateAndMutateTank(ReducerContext ctx, Tank tank, AIContext aiContext)
    {
        var pathState = aiContext.GetTankPath(tank.Id);
        bool isCurrentlyMoving = pathState != null && pathState.Value.Path.Length > 0;

        if (!isCurrentlyMoving)
        {
            var traversibilityMap = aiContext.GetTraversibilityMap();
            if (traversibilityMap != null)
            {
                var (targetX, targetY) = FindRandomPositionInSquare(tank, traversibilityMap.Value, aiContext.GetRandom(), TUTORIAL_MOVEMENT_SQUARE_SIZE);
                DriveTowards(ctx, tank, targetX, targetY);
            }
        }

        return tank;
    }

    private static (int x, int y) FindRandomPositionInSquare(Tank tank, Module.TraversibilityMap traversibilityMap, Random rng, int squareSize)
    {
        int currentX = (int)tank.PositionX;
        int currentY = (int)tank.PositionY;

        int minX = Math.Max(0, currentX - squareSize / 2);
        int maxX = Math.Min(traversibilityMap.Width - 1, currentX + squareSize / 2);
        int minY = Math.Max(0, currentY - squareSize / 2);
        int maxY = Math.Min(traversibilityMap.Height - 1, currentY + squareSize / 2);

        if (minX > maxX || minY > maxY)
        {
            return (currentX, currentY);
        }

        for (int attempt = 0; attempt < MAX_POSITION_SEARCH_ATTEMPTS; attempt++)
        {
            int targetX = minX + rng.Next(maxX - minX + 1);
            int targetY = minY + rng.Next(maxY - minY + 1);

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
