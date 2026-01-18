using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    internal const int HOMEGAME_WIDTH = 30;
    internal const int HOMEGAME_HEIGHT = 20;

    private static void CreateHomegame(ReducerContext ctx, string identityString)
    {
        CreateHomegameCommand.Call(ctx, identityString);
    }
}
