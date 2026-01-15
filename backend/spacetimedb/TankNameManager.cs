using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    private static readonly char[] Letters = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
        'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
        'u', 'v', 'w', 'x', 'y', 'z'
    ];

    private static readonly string[] NatoPhonetic = [
        "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot",
        "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima",
        "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo",
        "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "X-ray",
        "Yankee", "Zulu"
    ];

    public static string GenerateBotName(ReducerContext ctx)
    {
        return NatoPhonetic[ctx.Rng.Next(NatoPhonetic.Length)];
    }

    public static string? AllocateTargetCode(ReducerContext ctx, string gameId)
    {
        var tanksInGame = ctx.Db.tank.GameId.Filter(gameId);
        var usedCodes = new HashSet<string>();
        
        foreach (var tank in tanksInGame)
        {
            if (tank.TargetCode != null)
            {
                usedCodes.Add(tank.TargetCode);
            }
        }

        for (int i = 0; i < 260; i++)
        {
            var letter = Letters[ctx.Rng.Next(Letters.Length)];
            var digit = ctx.Rng.Next(10);
            var code = $"{letter}{digit}";
            
            if (!usedCodes.Contains(code))
            {
                return code;
            }
        }

        return null;
    }
}
