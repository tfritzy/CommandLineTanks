using SpacetimeDB;
using System.Collections.Generic;
using static Types;

public static partial class Module
{
    public static class GenerateDestinationAnchors
    {
        public static void Call(ReducerContext ctx, string gameId, byte[] traversibilityMap, int width, int height)
        {
            var validPositions = new List<(int x, int y)>();

            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int tileIndex = y * width + x;
                    int byteIndex = tileIndex / 8;
                    int bitIndex = tileIndex % 8;
                    
                    if (byteIndex < traversibilityMap.Length)
                    {
                        bool isTraversable = (traversibilityMap[byteIndex] & (1 << bitIndex)) != 0;
                        if (isTraversable)
                        {
                            validPositions.Add((x, y));
                        }
                    }
                }
            }

            int targetCount = (int)(validPositions.Count * 0.1f);
            
            RandomlySample(validPositions, targetCount, ctx.Rng);

            RemoveNeighboringPositions(validPositions, width, height, ctx.Rng);

            var usedCodes = new HashSet<string>();
            foreach (var existing in ctx.Db.destination.GameId.Filter(gameId))
            {
                usedCodes.Add(existing.TargetCode);
            }

            foreach (var (x, y) in validPositions)
            {
                var code = CreateDestinationWithRetry.Call(ctx, gameId, x + 0.5f, y + 0.5f, DestinationType.Anchor, usedCodes);
                if (code != null)
                {
                    usedCodes.Add(code);
                }
            }
        }

        private static void RandomlySample(List<(int x, int y)> positions, int targetCount, Random random)
        {
            while (positions.Count > targetCount)
            {
                int removeIndex = random.Next(positions.Count);
                positions[removeIndex] = positions[positions.Count - 1];
                positions.RemoveAt(positions.Count - 1);
            }
        }

        private static void RemoveNeighboringPositions(List<(int x, int y)> positions, int width, int height, Random random)
        {
            int CountNeighbors((int x, int y) pos, HashSet<(int x, int y)> posSet)
            {
                int count = 0;
                for (int dx = -4; dx <= 4; dx++)
                {
                    for (int dy = -4; dy <= 4; dy++)
                    {
                        if (dx == 0 && dy == 0) continue;
                        
                        int nx = pos.x + dx;
                        int ny = pos.y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height && posSet.Contains((nx, ny)))
                        {
                            count++;
                        }
                    }
                }
                return count;
            }

            var positionSet = new HashSet<(int x, int y)>(positions);
            var neighborCounts = new Dictionary<(int x, int y), int>();

            foreach (var pos in positions)
            {
                int neighborCount = CountNeighbors(pos, positionSet);
                if (neighborCount > 0)
                {
                    neighborCounts[pos] = neighborCount;
                }
            }

            while (neighborCounts.Count > 0)
            {
                int maxNeighborCount = 0;
                (int x, int y) posToRemove = (-1, -1);

                foreach (var kvp in neighborCounts)
                {
                    if (kvp.Value > maxNeighborCount)
                    {
                        maxNeighborCount = kvp.Value;
                        posToRemove = kvp.Key;
                    }
                }

                positions.Remove(posToRemove);
                positionSet.Remove(posToRemove);
                neighborCounts.Remove(posToRemove);

                for (int dx = -4; dx <= 4; dx++)
                {
                    for (int dy = -4; dy <= 4; dy++)
                    {
                        if (dx == 0 && dy == 0) continue;
                        
                        int nx = posToRemove.x + dx;
                        int ny = posToRemove.y + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height)
                        {
                            var neighborPos = (nx, ny);
                            if (neighborCounts.ContainsKey(neighborPos))
                            {
                                neighborCounts[neighborPos]--;
                                if (neighborCounts[neighborPos] == 0)
                                {
                                    neighborCounts.Remove(neighborPos);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
