using SpacetimeDB;
using static SpacetimeDB.Index;
using static Types;

public static partial class Module
{
    [Table(Name = "projectile_transform", Public = true)]
    public partial struct ProjectileTransform
    {
        [PrimaryKey]
        public ulong ProjectileId;

        [BTree]
        public string WorldId;

        public float PositionX;

        public float PositionY;

        public Vector2Float Velocity;

        public int CollisionCount;
    }
}
