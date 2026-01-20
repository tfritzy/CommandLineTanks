using SpacetimeDB;
using System.Collections.Generic;

public static partial class Module
{
    public static class AllocateTargetCode
    {

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
                string code = GenerateCode.Call(ctx);
                
                if (!usedCodes.Contains(code))
                {
                    return code;
                }
            }

            return null;
        }
    }
}
