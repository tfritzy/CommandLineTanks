using SpacetimeDB;
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

            var targetCode = AllocateDestinationCode.Call(ctx, gameId);
            if (targetCode != null)
            {
                ctx.Db.destination.Insert(Destination.Build(
                    ctx: ctx,
                    gameId: gameId,
                    targetCode: targetCode,
                    positionX: positionX,
                    positionY: positionY
                ));
            }
            
            return targetCode;
        }
    }
}
