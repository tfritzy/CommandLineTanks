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

    public static string? AllocateTankName(ReducerContext ctx, string worldId)
    {
        var tanksInWorld = ctx.Db.tank.WorldId.Filter(worldId);
        var usedNames = new HashSet<string>();
        
        foreach (var tank in tanksInWorld)
        {
            if (tank.Name != null)
            {
                usedNames.Add(tank.Name);
            }
        }

        foreach (var name in NatoPhoneticAlphabet)
        {
            if (!usedNames.Contains(name))
            {
                return name;
            }
        }

        return null;
    }
}
