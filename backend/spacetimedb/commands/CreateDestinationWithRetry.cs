using SpacetimeDB;
using System.Collections.Generic;
using static Types;

public static partial class Module
{
    public static class CreateDestinationWithRetry
    {
        public static string? Call(
            ReducerContext ctx,
            string gameId,
            float positionX,
            float positionY,
            DestinationType type,
            HashSet<string>? usedCodes = null,
            int maxAttempts = 50)
        {
            int gridX = (int)positionX;
            int gridY = (int)positionY;

            for (int attempt = 0; attempt < maxAttempts; attempt++)
            {
                var targetCode = GenerateCode.Call(ctx);
                if (usedCodes != null && usedCodes.Contains(targetCode))
                {
                    continue;
                }

                var existing = ctx.Db.destination.GameId_TargetCode.Filter((gameId, targetCode)).FirstOrDefault();
                if (existing.Id == null)
                {
                    ctx.Db.destination.Insert(Destination.Build(
                        ctx: ctx,
                        gameId: gameId,
                        targetCode: targetCode,
                        type: type,
                        positionX: positionX,
                        positionY: positionY,
                        gridX: gridX,
                        gridY: gridY
                    ));
                    return targetCode;
                }
            }
            
            return null;
        }
    }
}
