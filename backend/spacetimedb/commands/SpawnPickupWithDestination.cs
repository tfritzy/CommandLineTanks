using SpacetimeDB;
using System.Collections.Generic;
using static Types;

public static partial class Module
{
    public static class SpawnPickupWithDestination
    {
        public static string? Call(
            ReducerContext ctx,
            string gameId,
            float positionX,
            float positionY,
            int gridX,
            int gridY,
            PickupType pickupType,
            HashSet<string>? usedCodes = null,
            int? ammo = null)
        {
            var pickupId = GenerateId(ctx, "pickup");

            ctx.Db.pickup.Insert(Pickup.Build(
                ctx: ctx,
                id: pickupId,
                gameId: gameId,
                positionX: positionX,
                positionY: positionY,
                gridX: gridX,
                gridY: gridY,
                type: pickupType,
                ammo: ammo
            ));

            var targetCode = CreateDestinationWithRetry.Call(ctx, gameId, positionX, positionY, DestinationType.Pickup, usedCodes);
            
            return targetCode;
        }
    }
}
