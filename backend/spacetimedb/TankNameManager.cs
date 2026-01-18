using SpacetimeDB;

public static partial class Module
{
    public static string GenerateBotName(ReducerContext ctx, string gameId)
    {
        return GenerateBotNameCommand.Call(ctx, gameId);
    }

    public static string? AllocateTargetCode(ReducerContext ctx, string gameId)
    {
        return AllocateTargetCodeCommand.Call(ctx, gameId);
    }
}
