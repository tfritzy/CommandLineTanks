using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "destination", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(Destination.GameId), nameof(Destination.TargetCode) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(Destination.GameId), nameof(Destination.GridX), nameof(Destination.GridY) })]
    public partial struct Destination
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string GameId;

        public string TargetCode;
        public DestinationType Type;

        public float PositionX;
        public float PositionY;

        public int GridX;
        public int GridY;

        public static Destination Build(
            ReducerContext ctx,
            string? id = null,
            string? gameId = null,
            string? targetCode = null,
            DestinationType type = DestinationType.Anchor,
            float positionX = 0,
            float positionY = 0,
            int gridX = 0,
            int gridY = 0)
        {
            return new Destination
            {
                Id = id ?? GenerateId(ctx, "destination"),
                GameId = gameId ?? "",
                TargetCode = targetCode ?? "",
                Type = type,
                PositionX = positionX,
                PositionY = positionY,
                GridX = gridX,
                GridY = gridY
            };
        }
    }
}
