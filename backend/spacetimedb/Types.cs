using SpacetimeDB;

public static partial class Types
{
    [Type]
    public partial struct Vector2(int x, int y)
    {
        public int X = x;
        public int Y = y;
    }

    [Type]
    public partial struct Vector2Float(float x, float y)
    {
        public float X = x;
        public float Y = y;
    }

    [Type]
    public partial struct PathEntry
    {
        public Vector2Float Position;
        public float ThrottlePercent;
        public bool Reverse;
    }

    [Type]
    public enum Direction
    {
        North,
        NorthEast,
        East,
        SouthEast,
        South,
        SouthWest,
        West,
        NorthWest
    }

    [Type]
    public enum BaseTerrain : byte
    {
        Ground,
        Farm,
        BlackChecker,
        WhiteChecker
    }

    [Type]
    public enum TerrainDetailType : byte
    {
        None,
        Rock,
        Tree,
        HayBale,
        Label,
        FoundationEdge,
        FoundationCorner,
        FenceEdge,
        FenceCorner,
        TargetDummy,
        DeadTree
    }

    [Type]
    public enum PickupType : byte
    {
        TripleShooter,
        MissileLauncher,
        Health,
        Boomerang,
        Grenade,
        Rocket,
        Moag,
        Shield,
        Sniper
    }

    [Type]
    public enum GameState : byte
    {
        Playing,
        Results
    }

    [Type]
    public enum WorldVisibility : byte
    {
        Public,
        Private,
        CustomPublic
    }

    [Type]
    public enum GunType : byte
    {
        Base,
        TripleShooter,
        MissileLauncher,
        Boomerang,
        Grenade,
        Rocket,
        Moag,
        Sniper
    }

    [Type]
    public enum ProjectileType : byte
    {
        Normal,
        Missile,
        Boomerang,
        Grenade,
        Rocket,
        Moag,
        Sniper
    }

    [Type]
    public enum ExplosionTrigger : byte
    {
        None,
        OnExpiration,
        OnHit
    }

    [Type]
    public enum AIBehavior : byte
    {
        None,
        GameAI,
        Tilebound,
        RandomAim,
        Turret
    }

    [Type]
    public partial struct AiConfig
    {
        public int PenMinX;
        public int PenMaxX;
        public int PenMinY;
        public int PenMaxY;
    }

    [Type]
    public partial struct Gun
    {
        public GunType GunType;
        public int? Ammo;
        public int ProjectileCount;
        public float SpreadAngle;
        public int Damage;
        public float TrackingStrength;
        public float TrackingRadius;
        public ProjectileType ProjectileType;
        public float LifetimeSeconds;
        public int MaxCollisions;
        public bool PassThroughTerrain;
        public float CollisionRadius;
        public float? ExplosionRadius;
        public ExplosionTrigger ExplosionTrigger;
        public float? Damping;
        public bool Bounce;
        public float ProjectileSize;
        public float ProjectileSpeed;
    }

    [Type]
    public partial struct DamagedTile
    {
        public int X;
        public int Y;
        public ulong DamagedAt;
    }

    [Type]
    public partial struct DamagedTank
    {
        public string TankId;
        public ulong DamagedAt;
    }
}

public static class AIBehaviorExtensions
{
    public static bool IsAI(this Types.AIBehavior behavior)
    {
        return behavior != Types.AIBehavior.None;
    }
}

public struct FullTank
{
    public Module.Tank Tank;
    public Module.TankTransform Transform;

    public FullTank(Module.Tank tank, Module.TankTransform transform)
    {
        Tank = tank;
        Transform = transform;
    }

    public string Id => Tank.Id;
    public string WorldId => Tank.WorldId;
    public SpacetimeDB.Identity Owner => Tank.Owner;
    public string Name => Tank.Name;
    public string TargetCode => Tank.TargetCode;
    public string? JoinCode => Tank.JoinCode;
    public bool IsBot => Tank.IsBot;
    public Types.AIBehavior AIBehavior => Tank.AIBehavior;
    public Types.AiConfig? AiConfig => Tank.AiConfig;
    public int Alliance => Tank.Alliance;
    public int MaxHealth => Tank.MaxHealth;
    public float TopSpeed => Tank.TopSpeed;
    public float TurretRotationSpeed => Tank.TurretRotationSpeed;
    public int Health => Tank.Health;
    public int Kills => Tank.Kills;
    public int Deaths => Tank.Deaths;
    public int KillStreak => Tank.KillStreak;
    public string? Target => Tank.Target;
    public float TargetLead => Tank.TargetLead;
    public string? Message => Tank.Message;
    public Types.Gun[] Guns => Tank.Guns;
    public int SelectedGunIndex => Tank.SelectedGunIndex;
    public bool HasShield => Tank.HasShield;
    public long RemainingImmunityMicros => Tank.RemainingImmunityMicros;
    public ulong DeathTimestamp => Tank.DeathTimestamp;
    public SpacetimeDB.Identity? LastDamagedBy => Tank.LastDamagedBy;

    public float PositionX => Transform.PositionX;
    public float PositionY => Transform.PositionY;
    public Types.Vector2Float Velocity => Transform.Velocity;
    public int CollisionRegionX => Transform.CollisionRegionX;
    public int CollisionRegionY => Transform.CollisionRegionY;
    public float TurretRotation => Transform.TurretRotation;
    public float TargetTurretRotation => Transform.TargetTurretRotation;
    public float TurretAngularVelocity => Transform.TurretAngularVelocity;
    public ulong UpdatedAt => Transform.UpdatedAt;
}
