public static class ContextPools
{
    private static AIContext? _aiContext;

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
