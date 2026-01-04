using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static Pickup BuildPickup(
        ReducerContext ctx,
        string? id = null,
        string? worldId = null,
        float positionX = 0,
        float positionY = 0,
        int gridX = 0,
        int gridY = 0,
        PickupType type = PickupType.Health)
    {
        return new Pickup
        {
            Id = id ?? GenerateId(ctx, "pickup"),
            WorldId = worldId ?? "",
            PositionX = positionX,
            PositionY = positionY,
            GridX = gridX,
            GridY = gridY,
            Type = type
        };
    }
}
