using System.Collections.Generic;

public static class ContextPools
{
    private static readonly Dictionary<string, ProjectileUpdater.ProjectileUpdateContext> _projectileContexts = new Dictionary<string, ProjectileUpdater.ProjectileUpdateContext>();
    private static readonly Dictionary<string, TankUpdater.TankUpdateContext> _tankContexts = new Dictionary<string, TankUpdater.TankUpdateContext>();
    private static readonly Dictionary<string, AIContext> _aiContexts = new Dictionary<string, AIContext>();

    public static ProjectileUpdater.ProjectileUpdateContext GetProjectileContext(SpacetimeDB.ReducerContext ctx, string gameId, ulong currentTime)
    {
        if (!_projectileContexts.TryGetValue(gameId, out var context))
        {
            context = new ProjectileUpdater.ProjectileUpdateContext(ctx, gameId, currentTime);
            _projectileContexts[gameId] = context;
        }
        else
        {
            context.Reset(ctx, gameId, currentTime);
        }
        return context;
    }

    public static TankUpdater.TankUpdateContext GetTankContext(SpacetimeDB.ReducerContext ctx, string gameId)
    {
        if (!_tankContexts.TryGetValue(gameId, out var context))
        {
            context = new TankUpdater.TankUpdateContext(ctx, gameId);
            _tankContexts[gameId] = context;
        }
        else
        {
            context.Reset(ctx, gameId);
        }
        return context;
    }

    public static AIContext GetAIContext(SpacetimeDB.ReducerContext ctx, string gameId)
    {
        if (!_aiContexts.TryGetValue(gameId, out var context))
        {
            context = new AIContext(ctx, gameId);
            _aiContexts[gameId] = context;
        }
        else
        {
            context.Reset(ctx, gameId);
        }
        return context;
    }

    public static void RemoveGameContexts(string gameId)
    {
        _projectileContexts.Remove(gameId);
        _tankContexts.Remove(gameId);
        _aiContexts.Remove(gameId);
    }
}
