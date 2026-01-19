using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    public static class AllocateTargetCode
    {
        private static readonly char[] Letters = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
            'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
            'u', 'v', 'w', 'x', 'y', 'z'
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

            for (int i = 0; i < 676; i++)
            {
                var letter1 = Letters[ctx.Rng.Next(Letters.Length)];
                var letter2 = Letters[ctx.Rng.Next(Letters.Length)];
                var code = $"{letter1}{letter2}";
                
                if (!usedCodes.Contains(code))
                {
                    return code;
                }
            }

            return null;
        }
    }
}
