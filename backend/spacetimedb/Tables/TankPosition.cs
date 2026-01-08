using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "tank_position", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(CollisionRegionX), nameof(CollisionRegionY) })]
    public partial struct TankPosition
    {
        [PrimaryKey]
        public string TankId;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public float PositionX;

        public float PositionY;

        public Vector2Float Velocity;

        public int CollisionRegionX;

        public int CollisionRegionY;

        public ulong UpdatedAt;
    }
}
