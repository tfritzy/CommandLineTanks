using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    public static class GenerateBotName
    {
        private static readonly string[] NatoPhonetic = [
            "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot",
            "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima",
            "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo",
            "Sierra", "Tango", "Uniform", "Victor", "Whiskey", "X-ray",
            "Yankee", "Zulu"
        ];

        public static string Call(ReducerContext ctx, string gameId)
        {
            var tanksInGame = ctx.Db.tank.GameId.Filter(gameId);
            var usedNames = new HashSet<string>();
            
            foreach (var tank in tanksInGame)
            {
                if (!string.IsNullOrEmpty(tank.Name))
                {
                    usedNames.Add(tank.Name);
                }
            }

            for (int attempt = 0; attempt < 100; attempt++)
            {
                var baseName = NatoPhonetic[ctx.Rng.Next(NatoPhonetic.Length)];
                
                if (!usedNames.Contains(baseName))
                {
                    return baseName;
                }
                
                for (int suffix = 2; suffix <= 10; suffix++)
                {
                    var nameWithSuffix = $"{baseName}{suffix}";
                    if (!usedNames.Contains(nameWithSuffix))
                    {
                        return nameWithSuffix;
                    }
                }
            }

            return $"Bot{ctx.Rng.Next(1000, 10000)}";
        }
    }
}
