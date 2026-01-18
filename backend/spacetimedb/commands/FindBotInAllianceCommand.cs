using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static Tank? FindBotInAlliance(ReducerContext ctx, string gameId, int alliance)
    {
        foreach (var tank in ctx.Db.tank.GameId_IsBot.Filter((gameId, true)))
        {
            if (tank.Alliance == alliance)
            {
                return tank;
            }
        }
        return null;
    }
}
