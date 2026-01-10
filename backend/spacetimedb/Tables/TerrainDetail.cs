using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "terrain_detail", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(GameId), nameof(GridX), nameof(GridY) })]
    public partial struct TerrainDetail
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string GameId;

        public float PositionX;
        public float PositionY;

        public int GridX;
        public int GridY;

        public TerrainDetailType Type;

        public int? Health;

        public string? Label;

        public int Rotation;

        public static TerrainDetail Build(
            ReducerContext ctx,
            string? id = null,
            string? gameId = null,
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
                GameId = gameId ?? "",
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
