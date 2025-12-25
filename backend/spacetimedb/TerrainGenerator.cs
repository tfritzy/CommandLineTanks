using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;

public static partial class TerrainGenerator
{
    private const int WORLD_WIDTH = 100;
    private const int WORLD_HEIGHT = 54;
    private const int FIELD_MIN_SIZE = 5;
    private const int FIELD_MAX_SIZE = 10;
    private const int HAY_BALE_DENSITY_DIVISOR = 10;
    private const int MIN_STRUCTURES = 6;
    private const int STRUCTURE_COUNT_RANGE = 7;
    private const int MIN_LAKES = 1;
    private const int MAX_ADDITIONAL_LAKES = 2;
    private const int ROTATION_NORTH = 0;
    private const int ROTATION_EAST = 1;
    private const int ROTATION_SOUTH = 2;
    private const int ROTATION_WEST = 3;

    private static readonly int[] p = new int[512];

    public static (BaseTerrain[], List<(int x, int y, TerrainDetailType type, int rotation)>) GenerateTerrain(Random random)
    {
        InitPerlin(random);
        var baseTerrain = new BaseTerrain[WORLD_WIDTH * WORLD_HEIGHT];
        var terrainDetails = new List<(int x, int y, TerrainDetailType type, int rotation)>();
        var terrainDetailArray = new TerrainDetailType[WORLD_WIDTH * WORLD_HEIGHT];
        var rotationArray = new int[WORLD_WIDTH * WORLD_HEIGHT];

        for (int i = 0; i < baseTerrain.Length; i++)
        {
            baseTerrain[i] = BaseTerrain.Ground;
            terrainDetailArray[i] = TerrainDetailType.None;
            rotationArray[i] = 0;
        }

        GenerateRocks(terrainDetailArray, baseTerrain, random);

        GenerateLakes(baseTerrain, terrainDetailArray, random);

        Vector2[] fieldTiles = GenerateFields(rotationArray, terrainDetailArray, baseTerrain, random);

        GenerateTrees(terrainDetailArray, baseTerrain, fieldTiles, random);

        GenerateStructures(rotationArray, terrainDetailArray, baseTerrain, fieldTiles, random);

        for (int y = 0; y < WORLD_HEIGHT; y++)
        {
            for (int x = 0; x < WORLD_WIDTH; x++)
            {
                int index = y * WORLD_WIDTH + x;
                var type = terrainDetailArray[index];
                if (type != TerrainDetailType.None)
                {
                    terrainDetails.Add((x, y, type, rotationArray[index]));
                }
            }
        }

        return (baseTerrain, terrainDetails);
    }

    private static void GenerateRocks(TerrainDetailType[] terrainDetail, BaseTerrain[] baseTerrain, Random random)
    {
        int numRocks = 30 + random.Next(40);

        for (int i = 0; i < numRocks; i++)
        {
            int x = random.Next(WORLD_WIDTH);
            int y = random.Next(WORLD_HEIGHT);
            int index = y * WORLD_WIDTH + x;

            if (baseTerrain[index] == BaseTerrain.Ground && terrainDetail[index] == TerrainDetailType.None)
            {
                terrainDetail[index] = TerrainDetailType.Rock;
            }
        }
    }

    private static void GenerateLakes(BaseTerrain[] baseTerrain, TerrainDetailType[] terrainDetail, Random random)
    {
        float scale = 0.08f;
        float threshold = 0.35f;
        int numLakes = MIN_LAKES + random.Next(MAX_ADDITIONAL_LAKES + 1);

        for (int lakeIdx = 0; lakeIdx < numLakes; lakeIdx++)
        {
            float offsetX = (float)(random.NextDouble() * 1000);
            float offsetY = (float)(random.NextDouble() * 1000);

            for (int y = 0; y < WORLD_HEIGHT; y++)
            {
                for (int x = 0; x < WORLD_WIDTH; x++)
                {
                    int index = y * WORLD_WIDTH + x;

                    if (baseTerrain[index] != BaseTerrain.Ground || terrainDetail[index] != TerrainDetailType.None)
                    {
                        continue;
                    }

                    float noiseValue = Noise((x + offsetX) * scale, (y + offsetY) * scale);
                    if (noiseValue > threshold)
                    {
                        baseTerrain[index] = BaseTerrain.Lake;
                    }
                }
            }
        }
    }

    private static Vector2[] GenerateFields(int[] rotationArray, TerrainDetailType[] terrainDetail, BaseTerrain[] baseTerrain, Random random)
    {
        var fieldTilesList = new Vector2[WORLD_WIDTH * WORLD_HEIGHT];
        int fieldTilesCount = 0;
        int numFields = 2 + random.Next(3);

        for (int fieldIdx = 0; fieldIdx < numFields; fieldIdx++)
        {
            int attempts = 0;
            bool placed = false;

            while (!placed && attempts < 100)
            {
                attempts++;

                int fieldWidth = FIELD_MIN_SIZE + random.Next(FIELD_MAX_SIZE - FIELD_MIN_SIZE + 1);
                int fieldHeight = FIELD_MIN_SIZE + random.Next(FIELD_MAX_SIZE - FIELD_MIN_SIZE + 1);
                int startX = random.Next(WORLD_WIDTH - fieldWidth);
                int startY = random.Next(WORLD_HEIGHT - fieldHeight);

                bool validLocation = true;

                for (int y = startY - 1; y <= startY + fieldHeight; y++)
                {
                    for (int x = startX - 1; x <= startX + fieldWidth; x++)
                    {
                        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT)
                        {
                            validLocation = false;
                            break;
                        }

                        int index = y * WORLD_WIDTH + x;
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
                            int index = y * WORLD_WIDTH + x;
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
                            int fenceIndex = topY * WORLD_WIDTH + x;
                            if (terrainDetail[fenceIndex] == TerrainDetailType.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetailType.FenceEdge;
                                rotationArray[fenceIndex] = ROTATION_NORTH;
                            }
                        }

                        if (bottomY < WORLD_HEIGHT)
                        {
                            int fenceIndex = bottomY * WORLD_WIDTH + x;
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
                            int fenceIndex = y * WORLD_WIDTH + leftX;
                            if (terrainDetail[fenceIndex] == TerrainDetailType.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetailType.FenceEdge;
                                rotationArray[fenceIndex] = ROTATION_WEST;
                            }
                        }

                        if (rightX < WORLD_WIDTH)
                        {
                            int fenceIndex = y * WORLD_WIDTH + rightX;
                            if (terrainDetail[fenceIndex] == TerrainDetailType.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetailType.FenceEdge;
                                rotationArray[fenceIndex] = ROTATION_EAST;
                            }
                        }
                    }

                    if (topY >= 0 && leftX >= 0)
                    {
                        int cornerIndex = topY * WORLD_WIDTH + leftX;
                        if (terrainDetail[cornerIndex] == TerrainDetailType.None)
                        {
                            terrainDetail[cornerIndex] = TerrainDetailType.FenceCorner;
                            rotationArray[cornerIndex] = 0; // Top-Left
                        }
                    }

                    if (topY >= 0 && rightX < WORLD_WIDTH)
                    {
                        int cornerIndex = topY * WORLD_WIDTH + rightX;
                        if (terrainDetail[cornerIndex] == TerrainDetailType.None)
                        {
                            terrainDetail[cornerIndex] = TerrainDetailType.FenceCorner;
                            rotationArray[cornerIndex] = 1; // Top-Right
                        }
                    }

                    if (bottomY < WORLD_HEIGHT && leftX >= 0)
                    {
                        int cornerIndex = bottomY * WORLD_WIDTH + leftX;
                        if (terrainDetail[cornerIndex] == TerrainDetailType.None)
                        {
                            terrainDetail[cornerIndex] = TerrainDetailType.FenceCorner;
                            rotationArray[cornerIndex] = 3; // Bottom-Left
                        }
                    }

                    if (bottomY < WORLD_HEIGHT && rightX < WORLD_WIDTH)
                    {
                        int cornerIndex = bottomY * WORLD_WIDTH + rightX;
                        if (terrainDetail[cornerIndex] == TerrainDetailType.None)
                        {
                            terrainDetail[cornerIndex] = TerrainDetailType.FenceCorner;
                            rotationArray[cornerIndex] = 2; // Bottom-Right
                        }
                    }

                    for (int y = startY; y < startY + fieldHeight; y++)
                    {
                        for (int x = startX; x < startX + fieldWidth; x++)
                        {
                            if ((x + y * 2) % 4 == 0)
                            {
                                int hIndex = y * WORLD_WIDTH + x;
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

    private static void GenerateTrees(TerrainDetailType[] terrainDetail, BaseTerrain[] baseTerrain, Vector2[] fieldTiles, Random random)
    {
        float scale = 0.1f;
        float threshold = 0.2f;

        for (int y = 0; y < WORLD_HEIGHT; y++)
        {
            for (int x = 0; x < WORLD_WIDTH; x++)
            {
                int index = y * WORLD_WIDTH + x;

                if (baseTerrain[index] != BaseTerrain.Ground || terrainDetail[index] != TerrainDetailType.None)
                {
                    continue;
                }

                float noiseValue = Noise(x * scale, y * scale);
                if (noiseValue > threshold)
                {
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

                    bool neighborHasTree = false;
                    for (int dy = -1; dy <= 1; dy++)
                    {
                        for (int dx = -1; dx <= 1; dx++)
                        {
                            if (dx == 0 && dy == 0) continue;
                            int nx = x + dx;
                            int ny = y + dy;
                            if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT)
                            {
                                if (terrainDetail[ny * WORLD_WIDTH + nx] == TerrainDetailType.Tree)
                                {
                                    neighborHasTree = true;
                                    break;
                                }
                            }
                        }
                        if (neighborHasTree) break;
                    }

                    if (!neighborHasTree)
                    {
                        terrainDetail[index] = TerrainDetailType.Tree;
                    }
                }
            }
        }
    }

    public static int GetWorldWidth()
    {
        return WORLD_WIDTH;
    }

    public static int GetWorldHeight()
    {
        return WORLD_HEIGHT;
    }

    private static void GenerateStructures(
        int[] rotationArray,
        TerrainDetailType[] terrainDetail,
        BaseTerrain[] baseTerrain,
        Vector2[] fieldTiles,
        Random random)
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
                int startX = random.Next(2, WORLD_WIDTH - structureWidth - 2);
                int startY = random.Next(2, WORLD_HEIGHT - structureHeight - 2);

                bool validLocation = true;
                int objectsToReplace = 0;

                for (int x = startX; x < startX + structureWidth; x++)
                {
                    int topIndex = startY * WORLD_WIDTH + x;
                    int bottomIndex = (startY + structureHeight - 1) * WORLD_WIDTH + x;

                    if (baseTerrain[topIndex] != BaseTerrain.Ground)
                    {
                        validLocation = false;
                        break;
                    }
                    if (baseTerrain[bottomIndex] != BaseTerrain.Ground)
                    {
                        validLocation = false;
                        break;
                    }

                    if (terrainDetail[topIndex] != TerrainDetailType.None)
                    {
                        if (baseTerrain[topIndex] == BaseTerrain.Farm || terrainDetail[topIndex] == TerrainDetailType.FenceEdge || terrainDetail[topIndex] == TerrainDetailType.FenceCorner)
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

                    if (terrainDetail[bottomIndex] != TerrainDetailType.None)
                    {
                        if (baseTerrain[bottomIndex] == BaseTerrain.Farm || terrainDetail[bottomIndex] == TerrainDetailType.FenceEdge || terrainDetail[bottomIndex] == TerrainDetailType.FenceCorner)
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

                if (validLocation)
                {
                    for (int y = startY; y < startY + structureHeight; y++)
                    {
                        int leftIndex = y * WORLD_WIDTH + startX;
                        int rightIndex = y * WORLD_WIDTH + (startX + structureWidth - 1);

                        if (baseTerrain[leftIndex] != BaseTerrain.Ground)
                        {
                            validLocation = false;
                            break;
                        }
                        if (baseTerrain[rightIndex] != BaseTerrain.Ground)
                        {
                            validLocation = false;
                            break;
                        }

                        if (terrainDetail[leftIndex] != TerrainDetailType.None)
                        {
                            if (baseTerrain[leftIndex] == BaseTerrain.Farm || terrainDetail[leftIndex] == TerrainDetailType.FenceEdge || terrainDetail[leftIndex] == TerrainDetailType.FenceCorner)
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

                        if (terrainDetail[rightIndex] != TerrainDetailType.None)
                        {
                            if (baseTerrain[rightIndex] == BaseTerrain.Farm || terrainDetail[rightIndex] == TerrainDetailType.FenceEdge || terrainDetail[rightIndex] == TerrainDetailType.FenceCorner)
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
                                    int index = startY * WORLD_WIDTH + x;
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
                                    int index = (startY + structureHeight - 1) * WORLD_WIDTH + x;
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
                                    int index = y * WORLD_WIDTH + startX;
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
                                    int index = y * WORLD_WIDTH + (startX + structureWidth - 1);
                                    terrainDetail[index] = TerrainDetailType.FoundationEdge;
                                    rotationArray[index] = ROTATION_EAST;
                                }
                            }
                        }
                    }

                    if (!removeTopLeftCorner)
                    {
                        int index = startY * WORLD_WIDTH + startX;
                        terrainDetail[index] = TerrainDetailType.FoundationCorner;
                        rotationArray[index] = 0;
                    }

                    if (!removeTopRightCorner)
                    {
                        int index = startY * WORLD_WIDTH + (startX + structureWidth - 1);
                        terrainDetail[index] = TerrainDetailType.FoundationCorner;
                        rotationArray[index] = 1;
                    }

                    if (!removeBottomLeftCorner)
                    {
                        int index = (startY + structureHeight - 1) * WORLD_WIDTH + startX;
                        terrainDetail[index] = TerrainDetailType.FoundationCorner;
                        rotationArray[index] = 3;
                    }

                    if (!removeBottomRightCorner)
                    {
                        int index = (startY + structureHeight - 1) * WORLD_WIDTH + (startX + structureWidth - 1);
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
                BaseTerrain.Lake => false,
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
}
