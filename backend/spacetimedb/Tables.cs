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
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(GameState), nameof(IsHomeWorld), nameof(Visibility) })]
    public partial struct World
    {
        [PrimaryKey]
        public string Id;

        public string Name;
        public ulong CreatedAt;
        public int Width;
        public int Height;
        public BaseTerrain[] BaseTerrainLayer;
        [SpacetimeDB.Index.BTree]
        public GameState GameState;
        public bool IsHomeWorld;
        public ulong GameStartedAt;
        public long GameDurationMicros;
        public WorldVisibility Visibility;
        public bool HasPasscode;
        public int MaxPlayers;
        public int CurrentPlayerCount;
        public int BotCount;
    }

    [Table(Name = "world_passcode", Public = false)]
    public partial struct WorldPasscode
    {
        [PrimaryKey]
        public string WorldId;

        public string Passcode;
    }

    [Table(Name = "traversibility_map", Public = true)]
    public partial struct TraversibilityMap
    {
        [PrimaryKey]
        public string WorldId;

        public bool[] Map;
        public int Width;
        public int Height;
    }

    [Table(Name = "tank", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(TargetCode) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(CollisionRegionX), nameof(CollisionRegionY) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(Owner) })]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(IsBot) })]
    public partial struct Tank
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        [SpacetimeDB.Index.BTree]
        public Identity Owner;

        public string Name;

        public string TargetCode;

        public string? JoinCode;

        public bool IsBot;

        public AIBehavior AIBehavior;

        public int Alliance;

        public int Health;

        public int MaxHealth;

        public int Kills;

        public int Deaths;

        public int CollisionRegionX;

        public int CollisionRegionY;

        public string? Target;
        public float TargetLead;

        public string? Message;

        public float TopSpeed;
        public float TurretRotationSpeed;

        public float PositionX;
        public float PositionY;

        public Vector2Float Velocity;
        public float TurretAngularVelocity;

        public float TurretRotation;
        public float TargetTurretRotation;

        public Gun[] Guns;
        public int SelectedGunIndex;

        public long RemainingSmokescreenCooldownMicros;

        public bool HasShield;

        public long RemainingOverdriveCooldownMicros;

        public long RemainingOverdriveDurationMicros;

        public long RemainingImmunityMicros;

        public long RemainingRepairCooldownMicros;

        public bool IsRepairing;

        public ulong RepairStartedAt;

        public ulong DeathTimestamp;

        public ulong UpdatedAt;
    }

    [Table(Name = "projectile", Public = true)]
    public partial struct Projectile
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public string ShooterTankId;

        public int Alliance;

        public float PositionX;
        public float PositionY;

        public float Speed;
        public float Size;

        public Vector2Float Velocity;

        public int Damage;
        public float TrackingStrength;
        public float TrackingRadius;
        public ProjectileType ProjectileType;
        public ulong SpawnedAt;
        public float LifetimeSeconds;
        public bool ReturnsToShooter;
        public bool IsReturning;
        public int MaxCollisions;
        public int CollisionCount;
        public bool PassThroughTerrain;
        public float CollisionRadius;
        public float? ExplosionRadius;
        public ExplosionTrigger ExplosionTrigger;
        public float? Damping;
        public bool Bounce;
        public DamagedTile[] RecentlyDamagedTiles;
        public DamagedTank[] RecentlyHitTanks;
        public ulong UpdatedAt;
    }

    [Table(Name = "score", Public = true)]
    public partial struct Score
    {
        [PrimaryKey]
        public string WorldId;

        public int[] Kills;
    }

    [Table(Name = "terrain_detail", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(GridX), nameof(GridY) })]
    public partial struct TerrainDetail
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public float PositionX;
        public float PositionY;

        public int GridX;
        public int GridY;

        public TerrainDetailType Type;

        public int? Health;

        public string? Label;

        public int Rotation;
    }

    [Table(Name = "decoration", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(GridX), nameof(GridY) })]
    public partial struct Decoration
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public float PositionX;
        public float PositionY;

        public int GridX;
        public int GridY;

        public DecorationType Type;
    }

    [Table(Name = "pickup", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(GridX), nameof(GridY) })]
    public partial struct Pickup
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public float PositionX;
        public float PositionY;

        public int GridX;
        public int GridY;

        public PickupType Type;
    }

    [Table(Name = "smoke_cloud", Public = true)]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId), nameof(CollisionRegionX), nameof(CollisionRegionY) })]
    public partial struct SmokeCloud
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public float PositionX;
        public float PositionY;

        public int CollisionRegionX;
        public int CollisionRegionY;

        public ulong SpawnedAt;
        public float Radius;
    }

    [Table(Name = "kills", Public = true)]
    public partial struct Kill
    {
        [PrimaryKey]
        public string Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public Identity Killer;

        public string KilleeName;

        public ulong Timestamp;
    }

    [Table(Name = "tank_fire_state", Public = true)]
    public partial struct TankFireState
    {
        [PrimaryKey]
        public string TankId;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public ulong LastFireTime;
    }

    [Table(Name = "tank_path", Public = true)]
    public partial struct TankPath
    {
        [PrimaryKey]
        public string TankId;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public PathEntry[] Path;
    }
}
