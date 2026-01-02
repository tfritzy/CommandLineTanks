using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;

public static partial class TerrainGenerator
{
    private const int DEFAULT_WORLD_WIDTH = 64;
    private const int DEFAULT_WORLD_HEIGHT = 64;
    private const int MAX_WORLD_WIDTH = 200;
    private const int MAX_WORLD_HEIGHT = 200;
    private const int FIELD_MIN_SIZE = 3;
    private const int FIELD_MAX_SIZE = 6;
    private const int HAY_BALE_DENSITY_DIVISOR = 10;
    private const int MIN_STRUCTURES = 3;
    private const int STRUCTURE_COUNT_RANGE = 4;
    private const int ROTATION_NORTH = 0;
    private const int ROTATION_EAST = 1;
    private const int ROTATION_SOUTH = 2;
    private const int ROTATION_WEST = 3;

    private static readonly int[] p = new int[512];

    public static (BaseTerrain[], List<(int x, int y, TerrainDetailType type, int rotation)>) GenerateTerrain(Random random, int width = DEFAULT_WORLD_WIDTH, int height = DEFAULT_WORLD_HEIGHT)
    {
        width = Math.Clamp(width, 1, MAX_WORLD_WIDTH);
        height = Math.Clamp(height, 1, MAX_WORLD_HEIGHT);
        
        InitPerlin(random);
        var baseTerrain = new BaseTerrain[width * height];
        var terrainDetails = new List<(int x, int y, TerrainDetailType type, int rotation)>();
        var terrainDetailArray = new TerrainDetailType[width * height];
        var rotationArray = new int[width * height];

        for (int i = 0; i < baseTerrain.Length; i++)
        {
            baseTerrain[i] = BaseTerrain.Ground;
            terrainDetailArray[i] = TerrainDetailType.None;
            rotationArray[i] = 0;
        }

        GenerateRocks(terrainDetailArray, baseTerrain, random, width, height);

        Vector2[] fieldTiles = GenerateFields(rotationArray, terrainDetailArray, baseTerrain, random, width, height);

        GenerateTrees(rotationArray, terrainDetailArray, baseTerrain, fieldTiles, random, width, height);

        GenerateStructures(rotationArray, terrainDetailArray, baseTerrain, fieldTiles, random, width, height);

        EnsureSpawnZonesConnected(baseTerrain, terrainDetailArray, random, width, height);

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                int index = y * width + x;
                var type = terrainDetailArray[index];
                if (type != TerrainDetailType.None)
                {
                    terrainDetails.Add((x, y, type, rotationArray[index]));
                }
            }
        }

        return (baseTerrain, terrainDetails);
    }

    private static void GenerateRocks(TerrainDetailType[] terrainDetail, BaseTerrain[] baseTerrain, Random random, int width, int height)
    {
        int numRocks = 30 + random.Next(40);

        for (int i = 0; i < numRocks; i++)
        {
            int x = random.Next(width);
            int y = random.Next(height);
            int index = y * width + x;

            if (baseTerrain[index] == BaseTerrain.Ground && terrainDetail[index] == TerrainDetailType.None)
            {
                terrainDetail[index] = TerrainDetailType.Rock;
            }
        }
    }

    private static Vector2[] GenerateFields(int[] rotationArray, TerrainDetailType[] terrainDetail, BaseTerrain[] baseTerrain, Random random, int width, int height)
    {
        var fieldTilesList = new Vector2[width * height];
        int fieldTilesCount = 0;
        int numFields = 1 + random.Next(2);

        for (int fieldIdx = 0; fieldIdx < numFields; fieldIdx++)
        {
            int attempts = 0;
            bool placed = false;

            while (!placed && attempts < 100)
            {
                attempts++;

                int fieldWidth = FIELD_MIN_SIZE + random.Next(FIELD_MAX_SIZE - FIELD_MIN_SIZE + 1);
                int fieldHeight = FIELD_MIN_SIZE + random.Next(FIELD_MAX_SIZE - FIELD_MIN_SIZE + 1);
                int startX = random.Next(width - fieldWidth);
                int startY = random.Next(height - fieldHeight);

                bool validLocation = true;

                for (int y = startY - 1; y <= startY + fieldHeight; y++)
                {
                    for (int x = startX - 1; x <= startX + fieldWidth; x++)
                    {
                        if (x < 0 || x >= width || y < 0 || y >= height)
                        {
                            validLocation = false;
                            break;
                        }

                        int index = y * width + x;
                        if (baseTerrain[index] != BaseTerrain.Ground || terrainDetail[index] != TerrainDetailType.None)
                        {
                            validLocation = false;
                            break;
                        }
                    }

                    if (!validLocation) break;
                }

                if (validLocation)
                {
                    for (int y = startY; y < startY + fieldHeight; y++)
                    {
                        for (int x = startX; x < startX + fieldWidth; x++)
                        {
                            int index = y * width + x;
                            baseTerrain[index] = BaseTerrain.Farm;
                            if (fieldTilesCount < fieldTilesList.Length)
                            {
                                fieldTilesList[fieldTilesCount++] = new Vector2(x, y);
                            }
                        }
                    }


                    int topY = startY - 1;
                    int bottomY = startY + fieldHeight;
                    int leftX = startX - 1;
                    int rightX = startX + fieldWidth;

                    for (int x = startX; x < startX + fieldWidth; x++)
                    {
                        if (topY >= 0)
                        {
                            int fenceIndex = topY * width + x;
                            if (terrainDetail[fenceIndex] == TerrainDetailType.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetailType.FenceEdge;
                                rotationArray[fenceIndex] = ROTATION_NORTH;
                            }
                        }

                        if (bottomY < height)
                        {
                            int fenceIndex = bottomY * width + x;
                            if (terrainDetail[fenceIndex] == TerrainDetailType.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetailType.FenceEdge;
                                rotationArray[fenceIndex] = ROTATION_SOUTH;
                            }
                        }
                    }

                    for (int y = startY; y < startY + fieldHeight; y++)
                    {
                        if (leftX >= 0)
                        {
                            int fenceIndex = y * width + leftX;
                            if (terrainDetail[fenceIndex] == TerrainDetailType.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetailType.FenceEdge;
                                rotationArray[fenceIndex] = ROTATION_WEST;
                            }
                        }

                        if (rightX < width)
                        {
                            int fenceIndex = y * width + rightX;
                            if (terrainDetail[fenceIndex] == TerrainDetailType.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetailType.FenceEdge;
                                rotationArray[fenceIndex] = ROTATION_EAST;
                            }
                        }
                    }

                    if (topY >= 0 && leftX >= 0)
                    {
                        int cornerIndex = topY * width + leftX;
                        if (terrainDetail[cornerIndex] == TerrainDetailType.None)
                        {
                            terrainDetail[cornerIndex] = TerrainDetailType.FenceCorner;
                            rotationArray[cornerIndex] = 0;
                        }
                    }

                    if (topY >= 0 && rightX < width)
                    {
                        int cornerIndex = topY * width + rightX;
                        if (terrainDetail[cornerIndex] == TerrainDetailType.None)
                        {
                            terrainDetail[cornerIndex] = TerrainDetailType.FenceCorner;
                            rotationArray[cornerIndex] = 1;
                        }
                    }

                    if (bottomY < height && leftX >= 0)
                    {
                        int cornerIndex = bottomY * width + leftX;
                        if (terrainDetail[cornerIndex] == TerrainDetailType.None)
                        {
                            terrainDetail[cornerIndex] = TerrainDetailType.FenceCorner;
                            rotationArray[cornerIndex] = 3;
                        }
                    }

                    if (bottomY < height && rightX < width)
                    {
                        int cornerIndex = bottomY * width + rightX;
                        if (terrainDetail[cornerIndex] == TerrainDetailType.None)
                        {
                            terrainDetail[cornerIndex] = TerrainDetailType.FenceCorner;
                            rotationArray[cornerIndex] = 2;
                        }
                    }

                    for (int y = startY; y < startY + fieldHeight; y++)
                    {
                        for (int x = startX; x < startX + fieldWidth; x++)
                        {
                            if ((x + y * 2) % 4 == 0)
                            {
                                int hIndex = y * width + x;
                                if (baseTerrain[hIndex] == BaseTerrain.Farm)
                                {
                                    terrainDetail[hIndex] = TerrainDetailType.HayBale;
                                }
                            }
                        }
                    }

                    placed = true;
                }
            }
        }

        var result = new Vector2[fieldTilesCount];
        Array.Copy(fieldTilesList, result, fieldTilesCount);
        return result;
    }

    private static void GenerateTrees(int[] rotationArray, TerrainDetailType[] terrainDetail, BaseTerrain[] baseTerrain, Vector2[] fieldTiles, Random random, int width, int height)
    {
        float groveNoiseScale = 0.05f;
        float groveThreshold = 0.1f;
        
        float groveOffsetX = (float)(random.NextDouble() * 1000f);
        float groveOffsetY = (float)(random.NextDouble() * 1000f);

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                int index = y * width + x;

                if (baseTerrain[index] != BaseTerrain.Ground || terrainDetail[index] != TerrainDetailType.None)
                {
                    continue;
                }

                bool nearField = false;
                for (int f = 0; f < fieldTiles.Length; f++)
                {
                    if (Math.Abs(fieldTiles[f].X - x) <= 1 && Math.Abs(fieldTiles[f].Y - y) <= 1)
                    {
                        nearField = true;
                        break;
                    }
                }

                if (nearField) continue;

                float groveNoise = Noise((x + groveOffsetX) * groveNoiseScale, (y + groveOffsetY) * groveNoiseScale);
                
                if (groveNoise > groveThreshold)
                {
                    terrainDetail[index] = TerrainDetailType.Tree;
                    rotationArray[index] = 0;
                }
            }
        }

        RemoveNeighboringTrees(terrainDetail, random, width, height);
    }

    private static void RemoveNeighboringTrees(TerrainDetailType[] terrainDetail, Random random, int width, int height)
    {
        int[] dx = { -1, 1, 0, 0 };
        int[] dy = { 0, 0, -1, 1 };
        var treesWithNeighbors = new HashSet<int>();

        for (int i = 0; i < terrainDetail.Length; i++)
        {
            if (terrainDetail[i] != TerrainDetailType.Tree)
            {
                continue;
            }

            int x = i % width;
            int y = i / width;

            for (int j = 0; j < 4; j++)
            {
                int nx = x + dx[j];
                int ny = y + dy[j];

                if (nx >= 0 && nx < width && ny >= 0 && ny < height)
                {
                    int nindex = ny * width + nx;
                    if (terrainDetail[nindex] == TerrainDetailType.Tree)
                    {
                        treesWithNeighbors.Add(i);
                        break;
                    }
                }
            }
        }

        while (treesWithNeighbors.Count > 0)
        {
            int treeToRemove = treesWithNeighbors.ElementAt(random.Next(treesWithNeighbors.Count));
            
            terrainDetail[treeToRemove] = TerrainDetailType.None;
            treesWithNeighbors.Remove(treeToRemove);

            int rx = treeToRemove % width;
            int ry = treeToRemove / width;

            for (int i = 0; i < 4; i++)
            {
                int nx = rx + dx[i];
                int ny = ry + dy[i];

                if (nx >= 0 && nx < width && ny >= 0 && ny < height)
                {
                    int nindex = ny * width + nx;
                    if (terrainDetail[nindex] == TerrainDetailType.Tree)
                    {
                        int nnx = nindex % width;
                        int nny = nindex / width;
                        bool stillHasNeighbor = false;

                        for (int j = 0; j < 4; j++)
                        {
                            int nnxx = nnx + dx[j];
                            int nnyy = nny + dy[j];

                            if (nnxx >= 0 && nnxx < width && nnyy >= 0 && nnyy < height)
                            {
                                int nnindex = nnyy * width + nnxx;
                                if (terrainDetail[nnindex] == TerrainDetailType.Tree)
                                {
                                    stillHasNeighbor = true;
                                    break;
                                }
                            }
                        }

                        if (stillHasNeighbor)
                        {
                            treesWithNeighbors.Add(nindex);
                        }
                        else
                        {
                            treesWithNeighbors.Remove(nindex);
                        }
                    }
                }
            }
        }
    }

    public static int GetWorldWidth()
    {
        return DEFAULT_WORLD_WIDTH;
    }

    public static int GetWorldHeight()
    {
        return DEFAULT_WORLD_HEIGHT;
    }

    private static void GenerateStructures(
        int[] rotationArray,
        TerrainDetailType[] terrainDetail,
        BaseTerrain[] baseTerrain,
        Vector2[] fieldTiles,
        Random random,
        int width,
        int height)
    {
        int numStructures = MIN_STRUCTURES + random.Next(STRUCTURE_COUNT_RANGE);

        for (int structureIdx = 0; structureIdx < numStructures; structureIdx++)
        {
            int attempts = 0;
            bool placed = false;

            while (!placed && attempts < 100)
            {
                attempts++;

                int structureWidth = 4 + random.Next(5);
                int structureHeight = 4 + random.Next(5);
                int startX = random.Next(2, width - structureWidth - 2);
                int startY = random.Next(2, height - structureHeight - 2);

                bool validLocation = true;
                int objectsToReplace = 0;

                for (int y = startY - 1; y <= startY + structureHeight; y++)
                {
                    for (int x = startX - 1; x <= startX + structureWidth; x++)
                    {
                        if (x < 0 || x >= width || y < 0 || y >= height)
                        {
                            continue;
                        }

                        int index = y * width + x;
                        
                        if (baseTerrain[index] != BaseTerrain.Ground)
                        {
                            validLocation = false;
                            break;
                        }

                        var detail = terrainDetail[index];
                        if (detail == TerrainDetailType.FoundationEdge || detail == TerrainDetailType.FoundationCorner)
                        {
                            validLocation = false;
                            break;
                        }

                        if (detail != TerrainDetailType.None)
                        {
                            if (baseTerrain[index] == BaseTerrain.Farm || detail == TerrainDetailType.FenceEdge || detail == TerrainDetailType.FenceCorner)
                            {
                                validLocation = false;
                                break;
                            }
                            objectsToReplace++;
                            if (objectsToReplace > 2)
                            {
                                validLocation = false;
                                break;
                            }
                        }
                    }
                    if (!validLocation) break;
                }

                if (validLocation)
                {
                    bool removeTopLeftCorner = random.NextSingle() < 0.3f;
                    bool removeTopRightCorner = random.NextSingle() < 0.3f;
                    bool removeBottomLeftCorner = random.NextSingle() < 0.3f;
                    bool removeBottomRightCorner = random.NextSingle() < 0.3f;

                    for (int x = startX; x < startX + structureWidth; x++)
                    {
                        if (!removeTopLeftCorner || x > startX)
                        {
                            if (!removeTopRightCorner || x < startX + structureWidth - 1)
                            {
                                if (random.NextSingle() > 0.2f)
                                {
                                    int index = startY * width + x;
                                    terrainDetail[index] = TerrainDetailType.FoundationEdge;
                                    rotationArray[index] = ROTATION_NORTH;
                                }
                            }
                        }

                        if (!removeBottomLeftCorner || x > startX)
                        {
                            if (!removeBottomRightCorner || x < startX + structureWidth - 1)
                            {
                                if (random.NextSingle() > 0.2f)
                                {
                                    int index = (startY + structureHeight - 1) * width + x;
                                    terrainDetail[index] = TerrainDetailType.FoundationEdge;
                                    rotationArray[index] = ROTATION_SOUTH;
                                }
                            }
                        }
                    }

                    for (int y = startY; y < startY + structureHeight; y++)
                    {
                        if (!removeTopLeftCorner || y > startY)
                        {
                            if (!removeBottomLeftCorner || y < startY + structureHeight - 1)
                            {
                                if (random.NextSingle() > 0.2f)
                                {
                                    int index = y * width + startX;
                                    terrainDetail[index] = TerrainDetailType.FoundationEdge;
                                    rotationArray[index] = ROTATION_WEST;
                                }
                            }
                        }

                        if (!removeTopRightCorner || y > startY)
                        {
                            if (!removeBottomRightCorner || y < startY + structureHeight - 1)
                            {
                                if (random.NextSingle() > 0.2f)
                                {
                                    int index = y * width + (startX + structureWidth - 1);
                                    terrainDetail[index] = TerrainDetailType.FoundationEdge;
                                    rotationArray[index] = ROTATION_EAST;
                                }
                            }
                        }
                    }

                    if (!removeTopLeftCorner)
                    {
                        int index = startY * width + startX;
                        terrainDetail[index] = TerrainDetailType.FoundationCorner;
                        rotationArray[index] = 0;
                    }

                    if (!removeTopRightCorner)
                    {
                        int index = startY * width + (startX + structureWidth - 1);
                        terrainDetail[index] = TerrainDetailType.FoundationCorner;
                        rotationArray[index] = 1;
                    }

                    if (!removeBottomLeftCorner)
                    {
                        int index = (startY + structureHeight - 1) * width + startX;
                        terrainDetail[index] = TerrainDetailType.FoundationCorner;
                        rotationArray[index] = 3;
                    }

                    if (!removeBottomRightCorner)
                    {
                        int index = (startY + structureHeight - 1) * width + (startX + structureWidth - 1);
                        terrainDetail[index] = TerrainDetailType.FoundationCorner;
                        rotationArray[index] = 2;
                    }

                    placed = true;
                }
            }
        }
    }

    public static TerrainDetailType[] ConvertToArray(List<(int x, int y, TerrainDetailType type, int rotation)> terrainDetails, int width, int height)
    {
        var terrainDetailArray = new TerrainDetailType[width * height];
        for (int i = 0; i < terrainDetailArray.Length; i++)
        {
            terrainDetailArray[i] = TerrainDetailType.None;
        }
        foreach (var detail in terrainDetails)
        {
            int index = detail.y * width + detail.x;
            terrainDetailArray[index] = detail.type;
        }
        return terrainDetailArray;
    }

    public static bool[] CalculateTraversibility(BaseTerrain[] baseTerrain, TerrainDetailType[] terrainDetail)
    {
        var traversibility = new bool[baseTerrain.Length];

        for (int i = 0; i < baseTerrain.Length; i++)
        {
            bool baseTraversible = baseTerrain[i] switch
            {
                BaseTerrain.Ground => true,
                BaseTerrain.Farm => true,
                _ => true
            };

            bool detailTraversible = terrainDetail[i] switch
            {
                TerrainDetailType.None => true,
                TerrainDetailType.Rock => false,
                TerrainDetailType.Tree => false,
                TerrainDetailType.HayBale => false,
                TerrainDetailType.FoundationEdge => false,
                TerrainDetailType.FoundationCorner => false,
                TerrainDetailType.FenceEdge => true,
                TerrainDetailType.FenceCorner => true,
                TerrainDetailType.TargetDummy => false,
                TerrainDetailType.DeadTree => true,
                _ => true
            };

            traversibility[i] = baseTraversible && detailTraversible;
        }

        return traversibility;
    }

    private static void InitPerlin(Random random)
    {
        for (int i = 0; i < 256; i++) p[i] = i;
        for (int i = 0; i < 256; i++)
        {
            int j = random.Next(256);
            int temp = p[i];
            p[i] = p[j];
            p[j] = temp;
        }
        for (int i = 0; i < 256; i++) p[256 + i] = p[i];
    }

    private static float Fade(float t) => t * t * t * (t * (t * 6 - 15) + 10);
    private static float Lerp(float t, float a, float b) => a + t * (b - a);
    private static float Grad(int hash, float x, float y)
    {
        int h = hash & 15;
        float u = h < 8 ? x : y;
        float v = h < 4 ? y : h == 12 || h == 14 ? x : 0;
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    }

    private static float Noise(float x, float y)
    {
        int X = (int)Math.Floor(x) & 255;
        int Y = (int)Math.Floor(y) & 255;
        x -= (float)Math.Floor(x);
        y -= (float)Math.Floor(y);
        float u = Fade(x);
        float v = Fade(y);
        int A = p[X] + Y, AA = p[A], AB = p[A + 1], B = p[X + 1] + Y, BA = p[B], BB = p[B + 1];
        return Lerp(v, Lerp(u, Grad(p[AA], x, y), Grad(p[BA], x - 1, y)),
                       Lerp(u, Grad(p[AB], x, y - 1), Grad(p[BB], x - 1, y - 1)));
    }

    private static void EnsureSpawnZonesConnected(BaseTerrain[] baseTerrain, TerrainDetailType[] terrainDetail, Random random, int width, int height)
    {
        const int SPAWN_ZONE_WIDTH = 5;
        
        EnsureZoneConnected(baseTerrain, terrainDetail, 0, SPAWN_ZONE_WIDTH, 0, height, random, width, height);
        
        EnsureZoneConnected(baseTerrain, terrainDetail, width - SPAWN_ZONE_WIDTH, width, 0, height, random, width, height);
    }

    private static void EnsureZoneConnected(BaseTerrain[] baseTerrain, TerrainDetailType[] terrainDetail, int minX, int maxX, int minY, int maxY, Random random, int width, int height)
    {
        var traversible = new bool[width * height];
        for (int i = 0; i < traversible.Length; i++)
        {
            bool baseTraversible = baseTerrain[i] == BaseTerrain.Ground || baseTerrain[i] == BaseTerrain.Farm;
            bool detailTraversible = terrainDetail[i] == TerrainDetailType.None || 
                                     terrainDetail[i] == TerrainDetailType.FenceEdge || 
                                     terrainDetail[i] == TerrainDetailType.FenceCorner ||
                                     terrainDetail[i] == TerrainDetailType.DeadTree;
            traversible[i] = baseTraversible && detailTraversible;
        }

        int startX = -1, startY = -1;
        for (int y = minY; y < maxY; y++)
        {
            for (int x = minX; x < maxX; x++)
            {
                int index = y * width + x;
                if (traversible[index])
                {
                    startX = x;
                    startY = y;
                    break;
                }
            }
            if (startX >= 0) break;
        }

        if (startX < 0) return;

        var visited = new bool[width * height];
        var queue = new System.Collections.Generic.Queue<(int x, int y)>();
        queue.Enqueue((startX, startY));
        visited[startY * width + startX] = true;

        while (queue.Count > 0)
        {
            var (x, y) = queue.Dequeue();
            
            int[] dx = { -1, 1, 0, 0 };
            int[] dy = { 0, 0, -1, 1 };
            
            for (int i = 0; i < 4; i++)
            {
                int nx = x + dx[i];
                int ny = y + dy[i];
                
                if (nx >= minX && nx < maxX && ny >= minY && ny < maxY)
                {
                    int nindex = ny * width + nx;
                    if (!visited[nindex] && traversible[nindex])
                    {
                        visited[nindex] = true;
                        queue.Enqueue((nx, ny));
                    }
                }
            }
        }

        for (int y = minY; y < maxY; y++)
        {
            for (int x = minX; x < maxX; x++)
            {
                int index = y * width + x;
                if (traversible[index] && !visited[index])
                {
                    if (terrainDetail[index] != TerrainDetailType.None)
                    {
                        terrainDetail[index] = TerrainDetailType.None;
                    }
                }
            }
        }
    }
}
