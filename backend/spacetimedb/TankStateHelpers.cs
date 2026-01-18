using SpacetimeDB;

public static partial class Module
{
    public static void DeleteTankPathIfExists(ReducerContext ctx, string tankId)
    {
        DeleteTankPathCommand.Call(ctx, tankId);
    }

    public static void UpsertTankPath(ReducerContext ctx, TankPath tankPath)
    {
        UpsertTankPathCommand.Call(ctx, tankPath);
    }
}
