using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    public static class AllocatePickupTargetCode
    {
        private static readonly char[] Letters = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
            'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
            'u', 'v', 'w', 'x', 'y', 'z'
        ];

        public static string? Call(ReducerContext ctx, string gameId)
        {
            var tanksInGame = ctx.Db.tank.GameId.Filter(gameId);
            var pickupsInGame = ctx.Db.pickup.GameId.Filter(gameId);
            var usedCodes = new HashSet<string>();
            
            foreach (var tank in tanksInGame)
            {
                if (tank.TargetCode != null)
                {
                    usedCodes.Add(tank.TargetCode);
                }
            }

            foreach (var pickup in pickupsInGame)
            {
                if (pickup.TargetCode != null)
                {
                    usedCodes.Add(pickup.TargetCode);
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
}
