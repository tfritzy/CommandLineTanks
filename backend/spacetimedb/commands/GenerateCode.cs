using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    public static class GenerateCode
    {
        private static readonly char[] Letters = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
            'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
        ];

        private static readonly HashSet<string> BlockedCodes = new HashSet<string>
        {
            "kl", "lk",
            "jl", "lj",
            "jh", "hj",
            "kh", "hk"
        };

        public static string Call(ReducerContext ctx)
        {
            string code;
            int attempts = 0;
            do
            {
                var letter1 = Letters[ctx.Rng.Next(Letters.Length)];
                var letter2 = Letters[ctx.Rng.Next(Letters.Length)];
                var firstLetter = ctx.Rng.Next(2) == 0;
                code = firstLetter ? $"{letter1}{letter2}" : $"{letter2}{letter1}";
                attempts++;
            } while (BlockedCodes.Contains(code) && attempts < 100);
            
            return code;
        }
    }
}
