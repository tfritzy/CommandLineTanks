using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void CleanupHomegameAndJoinCommand(ReducerContext ctx, string gameId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        var existingTanks = ctx.Db.tank.Owner.Filter(ctx.Sender);

        foreach (var existingTank in existingTanks)
        {
            RemoveTankFromGame(ctx, existingTank);
        }

        DeleteHomeworldIfEmpty(ctx, identityString);

        var result = CreateTankInGame(ctx, gameId, ctx.Sender, joinCode);
        if (result != null)
        {
            var (tank, transform) = result.Value;
            AddTankToGame(ctx, tank, transform);
        }
    }
}
