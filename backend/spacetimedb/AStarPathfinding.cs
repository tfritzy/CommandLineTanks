using System;
using System.Collections.Generic;
using SpacetimeDB;

public static class AStarPathfinding
{
    private class AStarNode
    {
        public int X;
        public int Y;
        public int GCost;
        public int HCost;
        public int FCost => GCost + HCost;
        public AStarNode? Parent;
    }

    public static List<(float x, float y)> FindPath(
        int startX,
        int startY,
        int targetX,
        int targetY,
        Module.TraversibilityMap traversibilityMap)
    {
        var emptyPath = new List<(float x, float y)>();

        if (startX == targetX && startY == targetY)
        {
            return emptyPath;
        }

        var openSet = new List<AStarNode>();
        var closedSet = new HashSet<int>();
        AStarNode? closestNode = null;
        int closestDistance = int.MaxValue;

        var startNode = new AStarNode
        {
            X = startX,
            Y = startY,
            GCost = 0,
            HCost = CalculateHeuristic(startX, startY, targetX, targetY),
            Parent = null
        };

        openSet.Add(startNode);
        closestNode = startNode;
        closestDistance = startNode.HCost;

        int maxIterations = 500;
        int iterations = 0;

        while (openSet.Count > 0 && iterations < maxIterations)
        {
            iterations++;

            openSet.Sort((a, b) => a.FCost.CompareTo(b.FCost));
            var current = openSet[0];
            openSet.RemoveAt(0);

            int currentIndex = current.Y * traversibilityMap.Width + current.X;
            closedSet.Add(currentIndex);

            if (current.HCost < closestDistance)
            {
                closestNode = current;
                closestDistance = current.HCost;
            }

            if (current.X == targetX && current.Y == targetY)
            {
                var fullPath = new List<(float x, float y)>();
                var node = current;
                while (node.Parent != null)
                {
                    fullPath.Add((node.X + 0.5f, node.Y + 0.5f));
                    node = node.Parent;
                }
                fullPath.Reverse();
                return SimplifyPath(fullPath);
            }

            (int dx, int dy)[] neighbors = new[] {
                (1, 0), (-1, 0), (0, 1), (0, -1),
                (1, 1), (-1, 1), (1, -1), (-1, -1)
            };

            foreach (var (dx, dy) in neighbors)
            {
                int neighborX = current.X + dx;
                int neighborY = current.Y + dy;

                if (neighborX < 0 || neighborX >= traversibilityMap.Width ||
                    neighborY < 0 || neighborY >= traversibilityMap.Height)
                {
                    continue;
                }

                int neighborIndex = neighborY * traversibilityMap.Width + neighborX;

                if (closedSet.Contains(neighborIndex))
                {
                    continue;
                }

                if (!traversibilityMap.Map[neighborIndex])
                {
                    continue;
                }

                bool isDiagonal = dx != 0 && dy != 0;
                if (isDiagonal)
                {
                    int horizontalX = current.X + dx;
                    int horizontalY = current.Y;
                    int verticalX = current.X;
                    int verticalY = current.Y + dy;

                    int horizontalIndex = horizontalY * traversibilityMap.Width + horizontalX;
                    int verticalIndex = verticalY * traversibilityMap.Width + verticalX;

                    if (!traversibilityMap.Map[horizontalIndex] && !traversibilityMap.Map[verticalIndex])
                    {
                        continue;
                    }
                }
                int newGCost = current.GCost + (isDiagonal ? 14 : 10);
                var existingNode = openSet.Find(n => n.X == neighborX && n.Y == neighborY);

                if (existingNode != null)
                {
                    if (newGCost < existingNode.GCost)
                    {
                        existingNode.GCost = newGCost;
                        existingNode.Parent = current;
                    }
                }
                else
                {
                    var neighborNode = new AStarNode
                    {
                        X = neighborX,
                        Y = neighborY,
                        GCost = newGCost,
                        HCost = CalculateHeuristic(neighborX, neighborY, targetX, targetY),
                        Parent = current
                    };
                    openSet.Add(neighborNode);
                }
            }
        }

        if (closestNode != null && closestNode.Parent != null)
        {
            var partialPath = new List<(float x, float y)>();
            var node = closestNode;
            while (node.Parent != null)
            {
                partialPath.Add((node.X + 0.5f, node.Y + 0.5f));
                node = node.Parent;
            }
            partialPath.Reverse();
            return SimplifyPath(partialPath);
        }

        return emptyPath;
    }

    private static int CalculateHeuristic(int fromX, int fromY, int toX, int toY)
    {
        int dx = Math.Abs(toX - fromX);
        int dy = Math.Abs(toY - fromY);
        return 10 * (dx + dy) + (14 - 2 * 10) * Math.Min(dx, dy);
    }

    private static List<(float x, float y)> SimplifyPath(List<(float x, float y)> fullPath)
    {
        if (fullPath.Count <= 1)
        {
            return fullPath;
        }

        var simplifiedPath = new List<(float x, float y)>();
        simplifiedPath.Add(fullPath[0]);

        int currentDirectionX = 0;
        int currentDirectionY = 0;

        for (int i = 1; i < fullPath.Count; i++)
        {
            int dirX = Math.Sign(fullPath[i].x - fullPath[i - 1].x);
            int dirY = Math.Sign(fullPath[i].y - fullPath[i - 1].y);

            if (dirX != currentDirectionX || dirY != currentDirectionY)
            {
                simplifiedPath.Add(fullPath[i - 1]);
                currentDirectionX = dirX;
                currentDirectionY = dirY;
            }
        }

        simplifiedPath.Add(fullPath[^1]);

        return simplifiedPath;
    }
}
