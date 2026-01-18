using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private const int MAX_SPAWN_ATTEMPTS = 100;
    private const int SPAWN_ZONE_WIDTH = 5;

    public static void RespawnTank(ReducerContext ctx, Tank tank, TankTransform transform, string gameId, int alliance, bool resetKills = false, (float, float)? spawnPosition = null)
    {
        RespawnTankCommand.Call(ctx, tank, transform, gameId, alliance, resetKills, spawnPosition);
    }

    public static (float, float) FindSpawnPosition(ReducerContext ctx, Game game, int alliance, Random random)
    {
        return FindSpawnPositionCommand.Call(ctx, game, alliance, random);
    }

    public static (float, float) FindSpawnPosition(ReducerContext ctx, TraversibilityMap traversibilityMap, int alliance, Random random)
    {
        return FindSpawnPositionCommand.Call(ctx, traversibilityMap, alliance, random);
    }

    public static int GetBalancedAlliance(ReducerContext ctx, string gameId)
    {
        return GetBalancedAllianceCommand.Call(ctx, gameId);
    }

    public static (Tank, TankTransform)? CreateTankInGame(ReducerContext ctx, string gameId, Identity owner, string joinCode)
    {
        return CreateTankInGameCommand.Call(ctx, gameId, owner, joinCode);
    }
}
