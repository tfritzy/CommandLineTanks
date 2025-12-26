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
        Lake
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
        SpiderMine,
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
    public enum GunType : byte
    {
        Base,
        TripleShooter,
        MissileLauncher,
        Boomerang,
        Grenade,
        Rocket,
        Moag,
        SpiderMine,
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
        SpiderMine,
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
    public enum ProjectileTrailType : byte
    {
        Sniper
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
        public float? RaycastRange;
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
