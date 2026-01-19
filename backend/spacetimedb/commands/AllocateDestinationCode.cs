using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    public static class AllocateDestinationCode
    {
        private static readonly char[] Letters = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
            'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
            'u', 'v', 'w', 'x', 'y', 'z'
        ];

        public static string? Call(ReducerContext ctx, string gameId)
        {
            var letter = Letters[ctx.Rng.Next(Letters.Length)];
            var digit = ctx.Rng.Next(10);
            var code = $"{letter}{digit}";
            return code;
        }
    }
}
