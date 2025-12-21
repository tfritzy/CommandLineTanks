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
    private const int MIN_STRUCTURES = 3;
    private const int STRUCTURE_COUNT_RANGE = 4;
    private const int ROTATION_NORTH = 0;
    private const int ROTATION_EAST = 1;
    private const int ROTATION_SOUTH = 2;
    private const int ROTATION_WEST = 3;

    public static (BaseTerrain[], List<(int x, int y, TerrainDetailType type, int rotation)>) GenerateTerrain(Random random)
    {
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
        int numRocks = 100 + random.Next(100);

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

    private static Vector2[] GenerateFields(int[] rotationArray, TerrainDetailType[] terrainDetail, BaseTerrain[] baseTerrain, Random random)
    {
        var fieldTilesList = new Vector2[WORLD_WIDTH * WORLD_HEIGHT];
        int fieldTilesCount = 0;
        int numFields = 5 + random.Next(5);

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
                            if ((x + y) % 2 == 0)
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
        int numTrees = 200 + random.Next(200);

        for (int i = 0; i < numTrees; i++)
        {
            int x = random.Next(WORLD_WIDTH);
            int y = random.Next(WORLD_HEIGHT);
            int index = y * WORLD_WIDTH + x;

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

            if (nearField)
            {
                continue;
            }

            terrainDetail[index] = TerrainDetailType.Tree;
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
                    placed = true;
                    for (int y = startY; y < startY + structureHeight; y++)
                    {
                        for (int x = startX; x < startX + structureWidth; x++)
                        {
                            int index = y * WORLD_WIDTH + x;
                            if (random.NextSingle() < 0.3f)
                            {
                                terrainDetail[index] = TerrainDetailType.FoundationEdge;
                                rotationArray[index] = ROTATION_NORTH;
                            }
                            else
                            {
                                terrainDetail[index] = TerrainDetailType.FoundationCorner;
                                rotationArray[index] = 0;
                            }
                        }
                    }

                    for (int y = startY; y < startY + structureHeight; y++)
                    {
                        for (int x = startX; x < startX + structureWidth; x++)
                        {
                            int index = y * WORLD_WIDTH + x;
                            if (random.NextSingle() < 0.3f)
                            {
                                terrainDetail[index] = TerrainDetailType.FoundationEdge;
                                rotationArray[index] = ROTATION_SOUTH;
                            }
                            else
                            {
                                terrainDetail[index] = TerrainDetailType.FoundationCorner;
                                rotationArray[index] = 2;
                            }
                        }
                    }

                    for (int y = startY; y < startY + structureHeight; y++)
                    {
                        for (int x = startX; x < startX + structureWidth; x++)
                        {
                            int index = y * WORLD_WIDTH + x;
                            if (random.NextSingle() < 0.3f)
                            {
                                terrainDetail[index] = TerrainDetailType.FoundationEdge;
                                rotationArray[index] = ROTATION_WEST;
                            }
                            else
                            {
                                terrainDetail[index] = TerrainDetailType.FoundationCorner;
                                rotationArray[index] = 1;
                            }
                        }
                    }

                    for (int y = startY; y < startY + structureHeight; y++)
                    {
                        for (int x = startX; x < startX + structureWidth; x++)
                        {
                            int index = y * WORLD_WIDTH + x;
                            if (random.NextSingle() < 0.3f)
                            {
                                terrainDetail[index] = TerrainDetailType.FoundationEdge;
                                rotationArray[index] = ROTATION_EAST;
                            }
                            else
                            {
                                terrainDetail[index] = TerrainDetailType.FoundationCorner;
                                rotationArray[index] = 3;
                            }
                        }
                    }
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
            bool baseTraversible = true;

            bool detailTraversible = terrainDetail[i] switch
            {
                TerrainDetailType.None => true,
                TerrainDetailType.Rock => false,
                TerrainDetailType.Tree => false,
                TerrainDetailType.HayBale => false,
                TerrainDetailType.TripleShooterPickup => true,
                TerrainDetailType.MissileLauncherPickup => true,
                TerrainDetailType.HealthPickup => true,
                TerrainDetailType.BoomerangPickup => true,
                TerrainDetailType.GrenadePickup => true,
                TerrainDetailType.RocketPickup => true,
                TerrainDetailType.FoundationEdge => true,
                TerrainDetailType.FoundationCorner => true,
                TerrainDetailType.FenceEdge => true,
                TerrainDetailType.FenceCorner => true,
                TerrainDetailType.DeadTank => false,
                TerrainDetailType.TargetDummy => false,
                _ => true
            };

            traversibility[i] = baseTraversible && detailTraversible;
        }

        return traversibility;
    }
}
