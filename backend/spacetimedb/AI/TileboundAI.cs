using SpacetimeDB;
using static Types;
using System;
using static Module;

public static partial class TileboundAI
{
    private const int MAX_POSITION_SEARCH_ATTEMPTS = 50;
    private const int TILE_SIZE = 5;
    private const int MOVEMENT_TICK_INTERVAL = 2;

    public static Tank EvaluateAndMutateTank(ReducerContext ctx, FullTank fullTank, AIContext aiContext, int tickCount)
    {
        var tank = fullTank.Tank;

        if (tickCount % MOVEMENT_TICK_INTERVAL != 0)
        {
            return tank;
        }

        var pathState = aiContext.GetTankPath(tank.Id);
        bool isCurrentlyMoving = pathState != null && pathState.Value.Path.Length > 0;

        if (!isCurrentlyMoving)
        {
            var traversibilityMap = aiContext.GetTraversibilityMap();
            if (traversibilityMap != null)
            {
                var (targetX, targetY) = FindRandomPositionInTile(fullTank, traversibilityMap.Value, aiContext.GetRandom());
                tank = DriveTowards(ctx, fullTank, targetX, targetY);
            }
        }

        return tank;
    }

    private static (int x, int y) FindRandomPositionInTile(FullTank fullTank, Module.TraversibilityMap traversibilityMap, Random rng)
    {
        int tileMinX, tileMaxX, tileMinY, tileMaxY;

        if (fullTank.AiConfig.HasValue)
        {
            var config = fullTank.AiConfig.Value;
            tileMinX = config.PenMinX;
            tileMaxX = config.PenMaxX;
            tileMinY = config.PenMinY;
            tileMaxY = config.PenMaxY;
        }
        else
        {
            int currentX = (int)fullTank.PositionX;
            int currentY = (int)fullTank.PositionY;

            tileMinX = (currentX / TILE_SIZE) * TILE_SIZE;
            tileMinY = (currentY / TILE_SIZE) * TILE_SIZE;
            tileMaxX = Math.Min(tileMinX + TILE_SIZE - 1, traversibilityMap.Width - 1);
            tileMaxY = Math.Min(tileMinY + TILE_SIZE - 1, traversibilityMap.Height - 1);
        }

        if (tileMinX > tileMaxX || tileMinY > tileMaxY)
        {
            return ((int)fullTank.PositionX, (int)fullTank.PositionY);
        }

        for (int attempt = 0; attempt < MAX_POSITION_SEARCH_ATTEMPTS; attempt++)
        {
            int targetX = tileMinX + rng.Next(tileMaxX - tileMinX + 1);
            int targetY = tileMinY + rng.Next(tileMaxY - tileMinY + 1);

            int index = targetY * traversibilityMap.Width + targetX;
            if (index >= 0 && index < traversibilityMap.Map.Length * 8 && traversibilityMap.IsTraversable(index))
            {
                return (targetX, targetY);
            }
        }

        return ((int)fullTank.PositionX, (int)fullTank.PositionY);
    }

    private static Tank DriveTowards(ReducerContext ctx, FullTank fullTank, int targetX, int targetY)
    {
        var tank = fullTank.Tank;
        int currentX = (int)fullTank.PositionX;
        int currentY = (int)fullTank.PositionY;

        if (targetX == currentX && targetY == currentY)
        {
            return tank;
        }

        Vector2 currentPos = new Vector2(currentX, currentY);
        Vector2 targetPos = new Vector2(targetX, targetY);
        Vector2 offset = new Vector2(targetPos.X - currentPos.X, targetPos.Y - currentPos.Y);

        Vector2Float rootPos = new Vector2Float(fullTank.PositionX, fullTank.PositionY);
        Vector2Float nextPos = new(rootPos.X + offset.X, rootPos.Y + offset.Y);

        var newPathState = new Module.TankPath
        {
            TankId = fullTank.Id,
            GameId = fullTank.GameId,
            Owner = fullTank.Owner,
            Path = [nextPos]
        };

        UpsertTankPath(ctx, newPathState);

        if (fullTank.Alliance == 0)
        {
            var (direction, distance) = OffsetToDirectionAndDistance(offset.X, offset.Y);
            return tank with
            {
                Message = $"drive {direction} {distance}"
            };
        }

        return tank;
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
