using System;
using System.Collections.Generic;

public static class AStarPathfinding
{
    private const int STRAIGHT_COST = 10;
    private const int DIAGONAL_COST = 14;

    public static List<(float x, float y)> FindPath(
        int startX,
        int startY,
        int targetX,
        int targetY,
        Module.TraversibilityMap traversibilityMap)
    {
        var emptyPath = new List<(float x, float y)>();

        int width = traversibilityMap.Width;
        int height = traversibilityMap.Height;

        if (startX < 0 || startX >= width || startY < 0 || startY >= height)
            return emptyPath;
        if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height)
            return emptyPath;

        if (startX == targetX && startY == targetY)
            return emptyPath;

        var gCost = new Dictionary<int, int>();
        var fCost = new Dictionary<int, int>();
        var cameFrom = new Dictionary<int, int>();
        var closedSet = new HashSet<int>();

        var openSet = new PriorityQueue<int, int>();

        int startIndex = startY * width + startX;
        int targetIndex = targetY * width + targetX;

        gCost[startIndex] = 0;
        int startH = Heuristic(startX, startY, targetX, targetY);
        fCost[startIndex] = startH;
        openSet.Enqueue(startIndex, fCost[startIndex]);

        int closestNode = startIndex;
        int closestH = startH;

        while (openSet.Count > 0)
        {
            int current = openSet.Dequeue();

            if (current == targetIndex)
            {
                return ReconstructPath(cameFrom, current, width);
            }

            if (closedSet.Contains(current))
                continue;

            closedSet.Add(current);

            int currentH = Heuristic(current % width, current / width, targetX, targetY);
            if (currentH < closestH)
            {
                closestH = currentH;
                closestNode = current;
            }

            int currentX = current % width;
            int currentY = current / width;
            int currentG = gCost[current];

            for (int dy = -1; dy <= 1; dy++)
            {
                for (int dx = -1; dx <= 1; dx++)
                {
                    if (dx == 0 && dy == 0)
                        continue;

                    int neighborX = currentX + dx;
                    int neighborY = currentY + dy;

                    if (neighborX < 0 || neighborX >= width || neighborY < 0 || neighborY >= height)
                        continue;

                    int neighborIndex = neighborY * width + neighborX;

                    if (closedSet.Contains(neighborIndex))
                        continue;

                    if (!traversibilityMap.Map[neighborIndex])
                        continue;

                    bool isDiagonal = dx != 0 && dy != 0;
                    if (isDiagonal)
                    {
                        int adjacentH = currentY * width + neighborX;
                        int adjacentV = neighborY * width + currentX;
                        if (!traversibilityMap.Map[adjacentH] || !traversibilityMap.Map[adjacentV])
                            continue;
                    }

                    int moveCost = isDiagonal ? DIAGONAL_COST : STRAIGHT_COST;
                    int tentativeG = currentG + moveCost;

                    if (!gCost.TryGetValue(neighborIndex, out int existingG) || tentativeG < existingG)
                    {
                        cameFrom[neighborIndex] = current;
                        gCost[neighborIndex] = tentativeG;
                        int f = tentativeG + Heuristic(neighborX, neighborY, targetX, targetY);
                        fCost[neighborIndex] = f;
                        openSet.Enqueue(neighborIndex, f);
                    }
                }
            }
        }

        if (closestNode != startIndex)
        {
            return ReconstructPath(cameFrom, closestNode, width);
        }

        return emptyPath;
    }

    private static int Heuristic(int fromX, int fromY, int toX, int toY)
    {
        int dx = Math.Abs(toX - fromX);
        int dy = Math.Abs(toY - fromY);
        return STRAIGHT_COST * (dx + dy) + (DIAGONAL_COST - 2 * STRAIGHT_COST) * Math.Min(dx, dy);
    }

    private static List<(float x, float y)> ReconstructPath(
        Dictionary<int, int> cameFrom,
        int current,
        int width)
    {
        var path = new List<(float x, float y)>();

        while (cameFrom.ContainsKey(current))
        {
            int x = current % width;
            int y = current / width;
            path.Add((x + 0.5f, y + 0.5f));
            current = cameFrom[current];
        }

        path.Reverse();
        return path;
    }
}