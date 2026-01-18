using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    private static void CreateProjectile(ReducerContext ctx, Tank tank, float startX, float startY, float angle, Gun gun)
    {
        CreateProjectileCommand.Call(ctx, tank, startX, startY, angle, gun);
    }
}
