using SpacetimeDB;
using static Types;

public static partial class Module
{
    public partial struct TerrainDetail
    {
        public static TerrainDetail Build(
            ReducerContext ctx,
            string? id = null,
            string? worldId = null,
            float positionX = 0,
            float positionY = 0,
            int gridX = 0,
            int gridY = 0,
            TerrainDetailType type = TerrainDetailType.None,
            int? health = null,
            string? label = null,
            int rotation = 0)
        {
            return new TerrainDetail
            {
                Id = id ?? GenerateId(ctx, "td"),
                WorldId = worldId ?? "",
                PositionX = positionX,
                PositionY = positionY,
                GridX = gridX,
                GridY = gridY,
                Type = type,
                Health = health,
                Label = label,
                Rotation = rotation
            };
        }
    }
}
