using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "tank_transform", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(GameId), nameof(CollisionRegionX), nameof(CollisionRegionY) })]
    public partial struct TankTransform
    {
        [PrimaryKey]
        public string TankId;

        [SpacetimeDB.Index.BTree]
        public string GameId;

        public float PositionX;

        public float PositionY;

        public Vector2Float Velocity;

        public int CollisionRegionX;

        public int CollisionRegionY;

        public float TurretRotation;

        public float TargetTurretRotation;

        public float TurretAngularVelocity;

        public ulong UpdatedAt;
    }
}
