using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Name = "player", Public = true)]
    public partial struct Player
    {
        [PrimaryKey]
        public string Id;

        [Unique]
        public Identity Identity;

        public string Name;
        public ulong CreatedAt;
    }

    [Table(Name = "world", Public = true)]
    public partial struct World
    {
        [PrimaryKey]
        public string Id;

        public string Name;
        public ulong CreatedAt;
        public int Width;
        public int Height;
        public BaseTerrain[] BaseTerrainLayer;
        public TerrainDetail[] TerrainDetailLayer;
        public bool[] TraversibilityMap;
    }

    [Table(Name = "tank", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(Name) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(CollisionRegionX), nameof(CollisionRegionY) })]
    public partial struct Tank
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        [SpacetimeDB.Index.BTree]
        public Identity Owner;

        public string Name;

        public string? JoinCode;

        public Alliance Alliance;

        public int Health;

        public int CollisionRegionX;

        public int CollisionRegionY;

        public string? Target;
        public float TargetLead;

        public PathEntry[] Path;
        public float TopSpeed;
        public float BodyRotationSpeed;
        public float TurretRotationSpeed;

        public float PositionX;
        public float PositionY;

        public Vector2Float Velocity;
        public float BodyAngularVelocity;
        public float TurretAngularVelocity;

        public float BodyRotation;
        public float TargetBodyRotation;
        public float TurretRotation;
        public float TargetTurretRotation;
    }

    [Table(Name = "projectile", Public = true)]
    public partial struct Projectile
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public string ShooterTankId;

        public Alliance Alliance;

        public float PositionX;
        public float PositionY;

        public float Speed;
        public float Size;

        public Vector2Float Velocity;
    }
}
