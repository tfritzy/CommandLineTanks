using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    public static class AllocateTargetCode
    {
        private static readonly char[] Consonants = [
            'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm',
            'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'
        ];

        private static readonly char[] Vowels = [
            'a', 'e', 'i', 'o', 'u'
        ];

        public static string? Call(ReducerContext ctx, string gameId)
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

            for (int i = 0; i < 2205; i++)
            {
                var consonant1 = Consonants[ctx.Rng.Next(Consonants.Length)];
                var vowel = Vowels[ctx.Rng.Next(Vowels.Length)];
                var consonant2 = Consonants[ctx.Rng.Next(Consonants.Length)];
                var code = $"{consonant1}{vowel}{consonant2}";
                
                if (!usedCodes.Contains(code))
                {
                    return code;
                }
            }

            return null;
        }
    }
}
