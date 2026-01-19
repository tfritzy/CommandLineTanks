using SpacetimeDB;

public static partial class Module
{
    [Table(Name = "destination", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(Destination.GameId), nameof(Destination.TargetCode) })]
    public partial struct Destination
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string GameId;

        [Unique]
        public string TargetCode;

        public float PositionX;
        public float PositionY;

        public static Destination Build(
            ReducerContext ctx,
            string? id = null,
            string? gameId = null,
            string? targetCode = null,
            float positionX = 0,
            float positionY = 0)
        {
            return new Destination
            {
                Id = id ?? GenerateId(ctx, "destination"),
                GameId = gameId ?? "",
                TargetCode = targetCode ?? "",
                PositionX = positionX,
                PositionY = positionY
            };
        }
    }
}
