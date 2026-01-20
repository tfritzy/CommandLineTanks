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

        private static readonly HashSet<string> BlockedCodes = new HashSet<string>
        {
            "ne", "se"
        };

        public static string Call(ReducerContext ctx)
        {
            string code;
            int attempts = 0;
            do
            {
                var consonant = Consonants[ctx.Rng.Next(Consonants.Length)];
                var vowel = Vowels[ctx.Rng.Next(Vowels.Length)];
                var consonantFirst = ctx.Rng.Next(2) == 0;
                code = consonantFirst ? $"{consonant}{vowel}" : $"{vowel}{consonant}";
                attempts++;
            } while (BlockedCodes.Contains(code) && attempts < 100);
            
            return code;
        }
    }
}
