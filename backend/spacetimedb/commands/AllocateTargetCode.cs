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

        private static readonly HashSet<string> BlockedWords = new HashSet<string>
        {
            "ass", "bum", "cox", "cum", "cun", "dam", "dik", "fag",
            "fuc", "fuk", "gay", "god", "hel", "hoe", "jap", "jew",
            "jiz", "kok", "kys", "naz", "nig", "pee", "pis", "poo",
            "pus", "sex", "suc", "suk", "tit", "vag", "wap", "wet"
        };

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
                
                if (!usedCodes.Contains(code) && !BlockedWords.Contains(code))
                {
                    return code;
                }
            }

            return null;
        }
    }
}
