using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    public static class GenerateCode
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
            "pus", "sex", "suc", "suk", "tit", "vag", "wap", "wet",
            "coc"
        };

        private static readonly char[] Letters = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
            'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
            'u', 'v', 'w', 'x', 'y', 'z'
        ];

        public static string Call(ReducerContext ctx)
        {
            var consonant1 = Consonants[ctx.Rng.Next(Consonants.Length)];
            var vowel = Vowels[ctx.Rng.Next(Vowels.Length)];
            var consonant2 = Consonants[ctx.Rng.Next(Consonants.Length)];
            return $"{consonant1}{vowel}{consonant2}";
        }
    }
}
