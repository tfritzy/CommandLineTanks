using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "projectile_transform", Public = true)]
    public partial struct ProjectileTransform
    {
        [PrimaryKey]
        public string ProjectileId;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public float PositionX;

        public float PositionY;

        public Vector2Float Velocity;

        public float Speed;

        public bool IsReturning;

        public int CollisionCount;

        public DamagedTile[] RecentlyDamagedTiles;

        public DamagedTank[] RecentlyHitTanks;

        public ulong UpdatedAt;
    }
}
