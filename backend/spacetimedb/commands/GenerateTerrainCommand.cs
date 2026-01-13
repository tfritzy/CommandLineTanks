using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static (BaseTerrain[], (int x, int y, TerrainDetailType type, int rotation)[], byte[], byte[]) GenerateTerrainCommand(ReducerContext ctx, int width, int height)
    {
        var (baseTerrain, terrainDetails) = TerrainGenerator.GenerateTerrain(ctx.Rng, width, height);
        var terrainDetailArray = TerrainGenerator.ConvertToArray(
            terrainDetails,
            width,
            height
        );
        var traversibilityMap = TerrainGenerator.CalculateTraversibility(baseTerrain, terrainDetailArray);
        var projectileTraversibilityMap = TerrainGenerator.CalculateProjectileTraversibility(baseTerrain, terrainDetailArray);
        
        return (baseTerrain, terrainDetails.ToArray(), traversibilityMap, projectileTraversibilityMap);
    }
}
