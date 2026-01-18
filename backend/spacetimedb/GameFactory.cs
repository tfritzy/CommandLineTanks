using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static Game CreateGame(
        ReducerContext ctx,
        string gameId,
        BaseTerrain[] baseTerrain,
        (int x, int y, TerrainDetailType type, int rotation)[] terrainDetails,
        byte[] traversibilityMap,
        byte[] projectileTraversibilityMap,
        int width,
        int height,
        GameVisibility visibility = GameVisibility.Public,
        long? gameDurationMicros = null,
        Identity? owner = null,
        int minPlayersPerTeam = 0)
    {
        return CreateGameCommand.Call(ctx, gameId, baseTerrain, terrainDetails, traversibilityMap, projectileTraversibilityMap, width, height, visibility, gameDurationMicros, owner, minPlayersPerTeam);
    }
}
