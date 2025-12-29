using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    private static readonly string[] NatoPhoneticAlphabet = [
        "alpha", "bravo", "charlie", "delta", "echo", "foxtrot",
        "golf", "hotel", "india", "juliet", "kilo", "lima",
        "mike", "november", "oscar", "papa", "quebec", "romeo",
        "sierra", "tango", "uniform", "victor", "whiskey", "xray",
        "yankee", "zulu"
    ];

    public static string? AllocateTargetCode(ReducerContext ctx, string worldId)
    {
        var tanksInWorld = ctx.Db.tank.WorldId.Filter(worldId);
        var usedCodes = new HashSet<string>();
        
        foreach (var tank in tanksInWorld)
        {
            if (tank.TargetCode != null)
            {
                usedCodes.Add(tank.TargetCode);
            }
        }

        foreach (var code in NatoPhoneticAlphabet)
        {
            if (!usedCodes.Contains(code))
            {
                return code;
            }
        }

        return null;
    }
}
