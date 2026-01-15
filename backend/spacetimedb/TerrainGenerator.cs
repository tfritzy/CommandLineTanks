using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;

public static partial class TerrainGenerator
{
    private const int DEFAULT_GAME_WIDTH = 64;
    private const int DEFAULT_GAME_HEIGHT = 64;
    private const int MIN_GAME_WIDTH = 10;
    private const int MIN_GAME_HEIGHT = 10;
    private const int MAX_GAME_WIDTH = 200;
    private const int MAX_GAME_HEIGHT = 200;
    private const int FIELD_MIN_SIZE = 5;
    private const int FIELD_MAX_SIZE = 10;
    private const int HAY_BALE_DENSITY_DIVISOR = 10;
    private const int MIN_STRUCTURES = 5;
    private const int STRUCTURE_COUNT_RANGE = 6;
    private const int ROTATION_NORTH = 0;
    private const int ROTATION_EAST = 1;
    private const int ROTATION_SOUTH = 2;
    private const int ROTATION_WEST = 3;
    private const int LAKE_MIN_SIZE = 4;
    private const int LAKE_MAX_SIZE = 8;
    private const int NUM_LAKES = 2;
    private const double ROCK_DENSITY_BASE = 0.01;
    private const double ROCK_DENSITY_VARIANCE = 0.005;

    private static readonly int[] p = new int[512];

    public static (BaseTerrain[], List<(int x, int y, TerrainDetailType type, int rotation)>) GenerateTerrain(Random random, int width = DEFAULT_GAME_WIDTH, int height = DEFAULT_GAME_HEIGHT)
    {
        width = Math.Clamp(width, MIN_GAME_WIDTH, MAX_GAME_WIDTH);
        height = Math.Clamp(height, MIN_GAME_HEIGHT, MAX_GAME_HEIGHT);

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

        GenerateLakes(baseTerrain, random, width, height);

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
        int totalArea = width * height;
        int baseRockCount = (int)(totalArea * ROCK_DENSITY_BASE);
        int rockVariance = Math.Max(1, (int)(totalArea * ROCK_DENSITY_VARIANCE));
        int numRocks = baseRockCount + random.Next(rockVariance + 1);

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

    private static void GenerateLakes(BaseTerrain[] baseTerrain, Random random, int width, int height)
    {
        const int SPAWN_ZONE_WIDTH = 6;

        int minRequiredWidth = LAKE_MIN_SIZE + SPAWN_ZONE_WIDTH * 2 + 1;
        int minRequiredHeight = LAKE_MIN_SIZE + 4 + 1;
        if (width < minRequiredWidth || height < minRequiredHeight)
        {
            return;
        }

        for (int lakeIdx = 0; lakeIdx < NUM_LAKES; lakeIdx++)
        {
            int attempts = 0;
            bool placed = false;

            while (!placed && attempts < 100)
            {
                attempts++;

                int maxLakeWidth = Math.Min(LAKE_MAX_SIZE, width - SPAWN_ZONE_WIDTH * 2);
                int maxLakeHeight = Math.Min(LAKE_MAX_SIZE, height - 4);
                int lakeWidth = LAKE_MIN_SIZE + random.Next(Math.Max(1, maxLakeWidth - LAKE_MIN_SIZE + 1));
                int lakeHeight = LAKE_MIN_SIZE + random.Next(Math.Max(1, maxLakeHeight - LAKE_MIN_SIZE + 1));
                int xRange = width - lakeWidth - SPAWN_ZONE_WIDTH * 2;
                int yRange = height - lakeHeight - 4;
                int startX = SPAWN_ZONE_WIDTH + (xRange > 0 ? random.Next(xRange) : 0);
                int startY = 2 + (yRange > 0 ? random.Next(yRange) : 0);

                bool validLocation = true;

                for (int y = startY - 1; y <= startY + lakeHeight; y++)
                {
                    for (int x = startX - 1; x <= startX + lakeWidth; x++)
                    {
                        if (x < 0 || x >= width || y < 0 || y >= height)
                        {
                            validLocation = false;
                            break;
                        }

                        int index = y * width + x;
                        if (baseTerrain[index] != BaseTerrain.Ground)
                        {
                            validLocation = false;
                            break;
                        }
                    }

                    if (!validLocation) break;
                }

                if (validLocation)
                {
                    float centerX = startX + lakeWidth / 2.0f;
                    float centerY = startY + lakeHeight / 2.0f;
                    float radiusX = lakeWidth / 2.0f;
                    float radiusY = lakeHeight / 2.0f;

                    for (int y = startY; y < startY + lakeHeight; y++)
                    {
                        for (int x = startX; x < startX + lakeWidth; x++)
                        {
                            float dx = (x + 0.5f - centerX) / radiusX;
                            float dy = (y + 0.5f - centerY) / radiusY;
                            float distSq = dx * dx + dy * dy;

                            float noiseValue = Noise((x + 50) * 0.2f, (y + 50) * 0.2f) * 0.3f;
                            float threshold = 0.8f + noiseValue;

                            if (distSq < threshold)
                            {
                                int index = y * width + x;
                                baseTerrain[index] = BaseTerrain.Water;
                            }
                        }
                    }

                    placed = true;
                }
            }
        }
    }

    private static Vector2[] GenerateFields(int[] rotationArray, TerrainDetailType[] terrainDetail, BaseTerrain[] baseTerrain, Random random, int width, int height)
    {
        var fieldTilesList = new Vector2[width * height];
        int fieldTilesCount = 0;

        if (width <= FIELD_MIN_SIZE || height <= FIELD_MIN_SIZE)
        {
            return new Vector2[0];
        }

        int numFields = 1 + random.Next(2);

        for (int fieldIdx = 0; fieldIdx < numFields; fieldIdx++)
        {
            int attempts = 0;
            bool placed = false;

            while (!placed && attempts < 100)
            {
                attempts++;

                int maxFieldWidth = Math.Min(FIELD_MAX_SIZE, width);
                int maxFieldHeight = Math.Min(FIELD_MAX_SIZE, height);
                int fieldWidth = FIELD_MIN_SIZE + random.Next(Math.Max(1, maxFieldWidth - FIELD_MIN_SIZE + 1));
                int fieldHeight = FIELD_MIN_SIZE + random.Next(Math.Max(1, maxFieldHeight - FIELD_MIN_SIZE + 1));
                int xRange = width - fieldWidth;
                int yRange = height - fieldHeight;
                int startX = xRange > 0 ? random.Next(xRange) : 0;
                int startY = yRange > 0 ? random.Next(yRange) : 0;

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

        RandomlyRemoveTreesPrePass(terrainDetail, random, width, height);

        RemoveNeighboringTrees(terrainDetail, random, width, height);
    }

    public static int GetGameWidth()
    {
        return DEFAULT_GAME_WIDTH;
    }

    public static int GetGameHeight()
    {
        return DEFAULT_GAME_HEIGHT;
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
        const int MIN_STRUCTURE_SIZE = 4;
        const int STRUCTURE_PADDING = 4;
        if (width < MIN_STRUCTURE_SIZE + STRUCTURE_PADDING || height < MIN_STRUCTURE_SIZE + STRUCTURE_PADDING)
        {
            return;
        }

        int numStructures = MIN_STRUCTURES + random.Next(STRUCTURE_COUNT_RANGE);

        for (int structureIdx = 0; structureIdx < numStructures; structureIdx++)
        {
            int attempts = 0;
            bool placed = false;

            while (!placed && attempts < 100)
            {
                attempts++;

                int maxStructureWidth = Math.Min(8, width - STRUCTURE_PADDING);
                int maxStructureHeight = Math.Min(8, height - STRUCTURE_PADDING);
                int structureWidth = MIN_STRUCTURE_SIZE + random.Next(Math.Max(1, maxStructureWidth - MIN_STRUCTURE_SIZE + 1));
                int structureHeight = MIN_STRUCTURE_SIZE + random.Next(Math.Max(1, maxStructureHeight - MIN_STRUCTURE_SIZE + 1));
                int xMax = width - structureWidth - 2;
                int yMax = height - structureHeight - 2;
                int startX = xMax > 2 ? random.Next(2, xMax) : 2;
                int startY = yMax > 2 ? random.Next(2, yMax) : 2;

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

    public static byte[] CalculateTraversibility(BaseTerrain[] baseTerrain, TerrainDetailType[] terrainDetail)
    {
        var traversibility = new bool[baseTerrain.Length];

        for (int i = 0; i < baseTerrain.Length; i++)
        {
            bool baseTraversible = !baseTerrain[i].BlocksTanks();
            bool detailTraversible = !terrainDetail[i].BlocksTanks();
            traversibility[i] = baseTraversible && detailTraversible;
        }

        return BitPackingUtils.BoolArrayToByteArray(traversibility);
    }

    public static byte[] CalculateProjectileTraversibility(BaseTerrain[] baseTerrain, TerrainDetailType[] terrainDetail)
    {
        var traversibility = new bool[baseTerrain.Length];

        for (int i = 0; i < baseTerrain.Length; i++)
        {
            bool baseTraversible = !baseTerrain[i].BlocksProjectiles();
            bool detailTraversible = !terrainDetail[i].BlocksProjectiles();
            traversibility[i] = baseTraversible && detailTraversible;
        }

        return BitPackingUtils.BoolArrayToByteArray(traversibility);
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

    private static void RandomlyRemoveTreesPrePass(TerrainDetailType[] terrainDetail, Random random, int width, int height)
    {
        var treeIndices = new List<int>();

        for (int i = 0; i < terrainDetail.Length; i++)
        {
            if (terrainDetail[i] == TerrainDetailType.Tree)
            {
                treeIndices.Add(i);
            }
        }

        int treesToRemove = (int)(treeIndices.Count * 0.66);

        for (int i = treeIndices.Count - 1; i >= treeIndices.Count - treesToRemove; i--)
        {
            int swapIndex = random.Next(i + 1);
            int treeIndex = treeIndices[swapIndex];
            terrainDetail[treeIndex] = TerrainDetailType.None;
            treeIndices[swapIndex] = treeIndices[i];
        }
    }

    private static void RemoveNeighboringTrees(TerrainDetailType[] terrainDetail, Random random, int width, int height)
    {
        int[] dx = { -1, 1, 0, 0, -1, -1, 1, 1 };
        int[] dy = { 0, 0, -1, 1, -1, 1, -1, 1 };

        int CountTreeNeighbors(int index)
        {
            int x = index % width;
            int y = index / width;
            int count = 0;
            for (int i = 0; i < 8; i++)
            {
                int nx = x + dx[i];
                int ny = y + dy[i];
                if (nx >= 0 && nx < width && ny >= 0 && ny < height)
                {
                    if (terrainDetail[ny * width + nx] == TerrainDetailType.Tree)
                        count++;
                }
            }
            return count;
        }

        var treeNeighborCounts = new Dictionary<int, int>();

        for (int i = 0; i < terrainDetail.Length; i++)
        {
            if (terrainDetail[i] == TerrainDetailType.Tree)
            {
                int neighborCount = CountTreeNeighbors(i);
                if (neighborCount > 0)
                {
                    treeNeighborCounts[i] = neighborCount;
                }
            }
        }

        while (treeNeighborCounts.Count > 0)
        {
            int maxNeighborCount = 0;
            int treeToRemove = -1;

            foreach (var kvp in treeNeighborCounts)
            {
                if (kvp.Value > maxNeighborCount)
                {
                    maxNeighborCount = kvp.Value;
                    treeToRemove = kvp.Key;
                }
            }

            int rx = treeToRemove % width;
            int ry = treeToRemove / width;

            terrainDetail[treeToRemove] = TerrainDetailType.None;
            treeNeighborCounts.Remove(treeToRemove);

            for (int i = 0; i < 8; i++)
            {
                int nx = rx + dx[i];
                int ny = ry + dy[i];
                if (nx >= 0 && nx < width && ny >= 0 && ny < height)
                {
                    int neighborIndex = ny * width + nx;
                    if (terrainDetail[neighborIndex] == TerrainDetailType.Tree && treeNeighborCounts.ContainsKey(neighborIndex))
                    {
                        treeNeighborCounts[neighborIndex]--;
                        if (treeNeighborCounts[neighborIndex] == 0)
                        {
                            treeNeighborCounts.Remove(neighborIndex);
                        }
                    }
                }
            }
        }
    }
}
