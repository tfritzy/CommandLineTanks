using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "pickup", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(GameId), nameof(GridX), nameof(GridY) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(GameId), nameof(TargetCode) })]
    public partial struct Pickup
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string GameId;

        public string TargetCode;

        public float PositionX;
        public float PositionY;

        public int GridX;
        public int GridY;

        public PickupType Type;

        public int? Ammo;

        public static Pickup Build(
            ReducerContext ctx,
            string? id = null,
            string? gameId = null,
            string? targetCode = null,
            float positionX = 0,
            float positionY = 0,
            int gridX = 0,
            int gridY = 0,
            PickupType type = PickupType.Health,
            int? ammo = null)
        {
            return new Pickup
            {
                Id = id ?? GenerateId(ctx, "pickup"),
                GameId = gameId ?? "",
                TargetCode = targetCode ?? "",
                PositionX = positionX,
                PositionY = positionY,
                GridX = gridX,
                GridY = gridY,
                Type = type,
                Ammo = ammo
            };
        }
    }
}
