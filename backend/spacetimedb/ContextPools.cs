public static class ContextPools
{
    private static ProjectileUpdater.ProjectileUpdateContext? _projectileContext;
    private static TankUpdater.TankUpdateContext? _tankContext;
    private static AIContext? _aiContext;

    public static ProjectileUpdater.ProjectileUpdateContext GetProjectileContext(SpacetimeDB.ReducerContext ctx, string gameId, ulong currentTime)
    {
        if (_projectileContext == null)
        {
            _projectileContext = new ProjectileUpdater.ProjectileUpdateContext(ctx, gameId, currentTime);
        }
        else
        {
            _projectileContext.Reset(ctx, gameId, currentTime);
        }
        return _projectileContext;
    }

    public static TankUpdater.TankUpdateContext GetTankContext(SpacetimeDB.ReducerContext ctx, string gameId)
    {
        if (_tankContext == null)
        {
            _tankContext = new TankUpdater.TankUpdateContext(ctx, gameId);
        }
        else
        {
            _tankContext.Reset(ctx, gameId);
        }
        return _tankContext;
    }

    public static AIContext GetAIContext(SpacetimeDB.ReducerContext ctx, string gameId)
    {
        if (_aiContext == null)
        {
            _aiContext = new AIContext(ctx, gameId);
        }
        else
        {
            _aiContext.Reset(ctx, gameId);
        }
        return _aiContext;
    }
}
