using SpacetimeDB;
using static Types;
using System;
using System.Collections.Generic;

public static partial class TerrainGenerator
{
    private const int WORLD_WIDTH = 100;
    private const int WORLD_HEIGHT = 54;
    private const float STREAM_PROBABILITY = 0.25f;
    private const int MIN_BRIDGES = 3;
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

        bool hasStream = random.NextSingle() < STREAM_PROBABILITY;
        Vector2[] streamPath = Array.Empty<Vector2>();

        if (hasStream)
        {
            streamPath = GenerateStream(baseTerrain, random);
        }

        Vector2[] roadTiles = GenerateRoadsWithBridges(baseTerrain, terrainDetailArray, streamPath, random);

        GenerateRocks(terrainDetailArray, baseTerrain, random);

        Vector2[] fieldTiles = GenerateFields(rotationArray, terrainDetailArray, baseTerrain, roadTiles, random);

        GenerateTrees(terrainDetailArray, baseTerrain, roadTiles, streamPath, fieldTiles, random);

        GenerateStructures(rotationArray, terrainDetailArray, baseTerrain, roadTiles, streamPath, fieldTiles, random);

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

    private static Vector2[] GenerateStream(BaseTerrain[] baseTerrain, Random random)
    {
        var streamPath = new Vector2[WORLD_HEIGHT];

        int startX = (int)(WORLD_WIDTH * 0.125f + random.NextSingle() * WORLD_WIDTH * 0.75f);
        int endX = (int)(WORLD_WIDTH * 0.125f + random.NextSingle() * WORLD_WIDTH * 0.75f);

        int currentX = startX;

        for (int y = 0; y < WORLD_HEIGHT; y++)
        {
            float progress = (float)y / WORLD_HEIGHT;
            int targetX = (int)(startX + (endX - startX) * progress);

            if (currentX < targetX && random.NextSingle() > 0.3f)
            {
                currentX++;
            }
            else if (currentX > targetX && random.NextSingle() > 0.3f)
            {
                currentX--;
            }

            currentX = Math.Max(1, Math.Min(WORLD_WIDTH - 3, currentX));

            int index = y * WORLD_WIDTH + currentX;
            baseTerrain[index] = BaseTerrain.Stream;

            if (currentX + 1 < WORLD_WIDTH)
            {
                int indexNext = y * WORLD_WIDTH + (currentX + 1);
                baseTerrain[indexNext] = BaseTerrain.Stream;
            }

            streamPath[y] = new Vector2(currentX, y);
        }

        return streamPath;
    }

    private static Vector2[] GenerateRoadsWithBridges(BaseTerrain[] baseTerrain, TerrainDetailType[] terrainDetail, Vector2[] streamPath, Random random)
    {
        var roadTilesList = new Vector2[WORLD_WIDTH * WORLD_HEIGHT];
        int roadTilesCount = 0;
        var bridgeLocations = new Vector2[MIN_BRIDGES];
        int bridgesPlaced = 0;

        if (streamPath.Length > 0)
        {
            int attempts = 0;

            while (bridgesPlaced < MIN_BRIDGES && attempts < 100)
            {
                attempts++;
                int streamIndex = random.Next(10, streamPath.Length - 10);
                Vector2 streamPos = streamPath[streamIndex];

                bool tooClose = false;
                for (int i = 0; i < bridgesPlaced; i++)
                {
                    if (Math.Abs(bridgeLocations[i].Y - streamPos.Y) < 15)
                    {
                        tooClose = true;
                        break;
                    }
                }

                if (tooClose) continue;

                bridgeLocations[bridgesPlaced] = streamPos;

                for (int dx = 0; dx < 2; dx++)
                {
                    int bridgeX = streamPos.X + dx;
                    if (bridgeX >= 0 && bridgeX < WORLD_WIDTH)
                    {
                        int index = streamPos.Y * WORLD_WIDTH + bridgeX;
                        baseTerrain[index] = BaseTerrain.Road;
                        terrainDetail[index] = TerrainDetailType.Bridge;
                    }
                }

                int roadLength = 20 + random.Next(20);

                for (int i = 1; i <= roadLength; i++)
                {
                    int x1 = streamPos.X - i;
                    int x2 = streamPos.X + i;

                    if (x1 >= 0 && x1 < WORLD_WIDTH)
                    {
                        int index = streamPos.Y * WORLD_WIDTH + x1;
                        if (baseTerrain[index] != BaseTerrain.Stream)
                        {
                            baseTerrain[index] = BaseTerrain.Road;
                            if (roadTilesCount < roadTilesList.Length)
                            {
                                roadTilesList[roadTilesCount++] = new Vector2(x1, streamPos.Y);
                            }
                        }
                    }

                    if (x2 >= 0 && x2 < WORLD_WIDTH)
                    {
                        int index = streamPos.Y * WORLD_WIDTH + x2;
                        if (baseTerrain[index] != BaseTerrain.Stream)
                        {
                            baseTerrain[index] = BaseTerrain.Road;
                            if (roadTilesCount < roadTilesList.Length)
                            {
                                roadTilesList[roadTilesCount++] = new Vector2(x2, streamPos.Y);
                            }
                        }
                    }
                }

                bridgesPlaced++;
            }
        }
        else
        {
            int numRoads = 2 + random.Next(3);

            for (int i = 0; i < numRoads; i++)
            {
                int y = random.Next(WORLD_HEIGHT);

                for (int x = 0; x < WORLD_WIDTH; x++)
                {
                    int index = y * WORLD_WIDTH + x;
                    baseTerrain[index] = BaseTerrain.Road;
                    if (roadTilesCount < roadTilesList.Length)
                    {
                        roadTilesList[roadTilesCount++] = new Vector2(x, y);
                    }
                }
            }
        }

        var result = new Vector2[roadTilesCount];
        Array.Copy(roadTilesList, result, roadTilesCount);
        return result;
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

    private static Vector2[] GenerateFields(int[] rotationArray, TerrainDetailType[] terrainDetail, BaseTerrain[] baseTerrain, Vector2[] roadTiles, Random random)
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

                        bool onRoad = false;
                        for (int r = 0; r < roadTiles.Length; r++)
                        {
                            if (roadTiles[r].X == x && roadTiles[r].Y == y)
                            {
                                onRoad = true;
                                break;
                            }
                        }

                        if (onRoad)
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

    private static void GenerateTrees(TerrainDetailType[] terrainDetail, BaseTerrain[] baseTerrain, Vector2[] roadTiles, Vector2[] streamPath, Vector2[] fieldTiles, Random random)
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

            bool nearRoadOrStream = false;
            for (int dy = -1; dy <= 1; dy++)
            {
                for (int dx = -1; dx <= 1; dx++)
                {
                    int checkX = x + dx;
                    int checkY = y + dy;

                    if (checkX >= 0 && checkX < WORLD_WIDTH && checkY >= 0 && checkY < WORLD_HEIGHT)
                    {
                        int checkIndex = checkY * WORLD_WIDTH + checkX;
                        if (baseTerrain[checkIndex] == BaseTerrain.Road || baseTerrain[checkIndex] == BaseTerrain.Stream)
                        {
                            nearRoadOrStream = true;
                            break;
                        }
                    }
                }
                if (nearRoadOrStream) break;
            }

            if (nearRoadOrStream)
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
        Vector2[] roadTiles,
        Vector2[] streamPath,
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
                    bool tooCloseToRoadOrStream = false;
                    for (int x = startX - 1; x < startX + structureWidth + 1; x++)
                    {
                        for (int y = startY - 1; y < startY + structureHeight + 1; y++)
                        {
                            for (int r = 0; r < roadTiles.Length; r++)
                            {
                                if (roadTiles[r].X == x && roadTiles[r].Y == y)
                                {
                                    tooCloseToRoadOrStream = true;
                                    break;
                                }
                            }
                            if (tooCloseToRoadOrStream) break;

                            for (int s = 0; s < streamPath.Length; s++)
                            {
                                if (streamPath[s].X == x && streamPath[s].Y == y)
                                {
                                    tooCloseToRoadOrStream = true;
                                    break;
                                }
                            }
                            if (tooCloseToRoadOrStream) break;
                        }
                        if (tooCloseToRoadOrStream) break;
                    }

                    if (tooCloseToRoadOrStream)
                    {
                        validLocation = false;
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
            bool baseTraversible = baseTerrain[i] != BaseTerrain.Stream;

            bool detailTraversible = terrainDetail[i] switch
            {
                TerrainDetailType.None => true,
                TerrainDetailType.Bridge => true,
                TerrainDetailType.Rock => false,
                TerrainDetailType.Tree => false,
                TerrainDetailType.HayBale => false,
                TerrainDetailType.TripleShooterPickup => true,
                TerrainDetailType.MissileLauncherPickup => true,
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
