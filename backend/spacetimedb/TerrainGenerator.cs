using SpacetimeDB;
using static Types;

public static partial class TerrainGenerator
{
    private const int WORLD_WIDTH = 100;
    private const int WORLD_HEIGHT = 100;
    private const float STREAM_PROBABILITY = 0.25f;
    private const int MIN_BRIDGES = 3;
    private const int FIELD_MIN_SIZE = 5;
    private const int FIELD_MAX_SIZE = 10;
    private const int CLIFF_POCKET_SIZE = 4;
    private const int HAY_BALE_DENSITY_DIVISOR = 10;

    public static (BaseTerrain[], TerrainDetail[]) GenerateTerrain(RandomContext random)
    {
        var baseTerrain = new BaseTerrain[WORLD_WIDTH * WORLD_HEIGHT];
        var terrainDetail = new TerrainDetail[WORLD_WIDTH * WORLD_HEIGHT];

        for (int i = 0; i < baseTerrain.Length; i++)
        {
            baseTerrain[i] = BaseTerrain.Ground;
            terrainDetail[i] = TerrainDetail.None;
        }

        bool hasStream = random.NextFloat() < STREAM_PROBABILITY;
        Vector2[] streamPath = Array.Empty<Vector2>();
        
        if (hasStream)
        {
            streamPath = GenerateStream(baseTerrain, random);
        }

        Vector2[] roadTiles = GenerateRoadsWithBridges(baseTerrain, terrainDetail, streamPath, random);

        GenerateCliffs(terrainDetail, baseTerrain, random);

        GenerateRocks(terrainDetail, baseTerrain, random);

        Vector2[] fieldTiles = GenerateFields(terrainDetail, baseTerrain, roadTiles, random);

        GenerateTrees(terrainDetail, baseTerrain, roadTiles, streamPath, fieldTiles, random);

        return (baseTerrain, terrainDetail);
    }

    private static Vector2[] GenerateStream(BaseTerrain[] baseTerrain, RandomContext random)
    {
        var streamPath = new Vector2[WORLD_HEIGHT];
        
        int startX = (int)(WORLD_WIDTH * 0.125f + random.NextFloat() * WORLD_WIDTH * 0.75f);
        int endX = (int)(WORLD_WIDTH * 0.125f + random.NextFloat() * WORLD_WIDTH * 0.75f);
        
        int currentX = startX;
        
        for (int y = 0; y < WORLD_HEIGHT; y++)
        {
            float progress = (float)y / WORLD_HEIGHT;
            int targetX = (int)(startX + (endX - startX) * progress);
            
            if (currentX < targetX && random.NextFloat() > 0.3f)
            {
                currentX++;
            }
            else if (currentX > targetX && random.NextFloat() > 0.3f)
            {
                currentX--;
            }
            
            currentX = Math.Max(1, Math.Min(WORLD_WIDTH - 2, currentX));
            
            int index = y * WORLD_WIDTH + currentX;
            baseTerrain[index] = BaseTerrain.Stream;
            streamPath[y] = new Vector2(currentX, y);
        }
        
        return streamPath;
    }

    private static Vector2[] GenerateRoadsWithBridges(BaseTerrain[] baseTerrain, TerrainDetail[] terrainDetail, Vector2[] streamPath, RandomContext random)
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
                        terrainDetail[index] = TerrainDetail.Bridge;
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

    private static void GenerateCliffs(TerrainDetail[] terrainDetail, BaseTerrain[] baseTerrain, RandomContext random)
    {
        int numCliffPockets = 8 + random.Next(8);
        
        for (int i = 0; i < numCliffPockets; i++)
        {
            int centerX = random.Next(WORLD_WIDTH);
            int centerY = random.Next(WORLD_HEIGHT);
            int size = CLIFF_POCKET_SIZE + random.Next(3);
            
            for (int dy = -size / 2; dy <= size / 2; dy++)
            {
                for (int dx = -size / 2; dx <= size / 2; dx++)
                {
                    int x = centerX + dx;
                    int y = centerY + dy;
                    
                    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT)
                    {
                        int index = y * WORLD_WIDTH + x;
                        if (baseTerrain[index] == BaseTerrain.Ground && random.NextFloat() > 0.3f)
                        {
                            terrainDetail[index] = TerrainDetail.Cliff;
                        }
                    }
                }
            }
        }
    }

    private static void GenerateRocks(TerrainDetail[] terrainDetail, BaseTerrain[] baseTerrain, RandomContext random)
    {
        int numRocks = 100 + random.Next(100);
        
        for (int i = 0; i < numRocks; i++)
        {
            int x = random.Next(WORLD_WIDTH);
            int y = random.Next(WORLD_HEIGHT);
            int index = y * WORLD_WIDTH + x;
            
            if (baseTerrain[index] == BaseTerrain.Ground && terrainDetail[index] == TerrainDetail.None)
            {
                terrainDetail[index] = TerrainDetail.Rock;
            }
        }
    }

    private static Vector2[] GenerateFields(TerrainDetail[] terrainDetail, BaseTerrain[] baseTerrain, Vector2[] roadTiles, RandomContext random)
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
                        if (baseTerrain[index] != BaseTerrain.Ground || terrainDetail[index] != TerrainDetail.None)
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
                            terrainDetail[index] = TerrainDetail.Field;
                            if (fieldTilesCount < fieldTilesList.Length)
                            {
                                fieldTilesList[fieldTilesCount++] = new Vector2(x, y);
                            }
                        }
                    }
                    
                    for (int x = startX; x < startX + fieldWidth; x++)
                    {
                        if (startY > 0)
                        {
                            int fenceIndex = (startY - 1) * WORLD_WIDTH + x;
                            if (terrainDetail[fenceIndex] == TerrainDetail.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetail.Fence;
                            }
                        }
                        
                        if (startY + fieldHeight < WORLD_HEIGHT)
                        {
                            int fenceIndex = (startY + fieldHeight) * WORLD_WIDTH + x;
                            if (terrainDetail[fenceIndex] == TerrainDetail.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetail.Fence;
                            }
                        }
                    }
                    
                    for (int y = startY; y < startY + fieldHeight; y++)
                    {
                        if (startX > 0)
                        {
                            int fenceIndex = y * WORLD_WIDTH + (startX - 1);
                            if (terrainDetail[fenceIndex] == TerrainDetail.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetail.Fence;
                            }
                        }
                        
                        if (startX + fieldWidth < WORLD_WIDTH)
                        {
                            int fenceIndex = y * WORLD_WIDTH + (startX + fieldWidth);
                            if (terrainDetail[fenceIndex] == TerrainDetail.None)
                            {
                                terrainDetail[fenceIndex] = TerrainDetail.Fence;
                            }
                        }
                    }
                    
                    int numHayBales = (fieldWidth * fieldHeight) / HAY_BALE_DENSITY_DIVISOR;
                    for (int i = 0; i < numHayBales; i++)
                    {
                        int hx = startX + random.Next(fieldWidth);
                        int hy = startY + random.Next(fieldHeight);
                        int hIndex = hy * WORLD_WIDTH + hx;
                        
                        if (terrainDetail[hIndex] == TerrainDetail.Field)
                        {
                            terrainDetail[hIndex] = TerrainDetail.HayBale;
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

    private static void GenerateTrees(TerrainDetail[] terrainDetail, BaseTerrain[] baseTerrain, Vector2[] roadTiles, Vector2[] streamPath, Vector2[] fieldTiles, RandomContext random)
    {
        int numTrees = 200 + random.Next(200);
        
        for (int i = 0; i < numTrees; i++)
        {
            int x = random.Next(WORLD_WIDTH);
            int y = random.Next(WORLD_HEIGHT);
            int index = y * WORLD_WIDTH + x;
            
            if (baseTerrain[index] != BaseTerrain.Ground || terrainDetail[index] != TerrainDetail.None)
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
            
            terrainDetail[index] = TerrainDetail.Tree;
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
}
