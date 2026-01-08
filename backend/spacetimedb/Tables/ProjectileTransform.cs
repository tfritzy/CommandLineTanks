using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "projectile_transform", Public = true)]
    public partial struct ProjectileTransform
    {
        [PrimaryKey]
        public ulong ProjectileId;

        public float PositionX;

        public float PositionY;

        public Vector2Float Velocity;

        public int CollisionCount;
    }
}
