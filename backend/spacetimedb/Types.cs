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
        public Vector2 Position;
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
        Stream,
        Road
    }

    [Type]
    public enum TerrainDetailType : byte
    {
        None,
        Cliff,
        Rock,
        Tree,
        Bridge,
        Fence,
        HayBale,
        Field,
        Label,
        TripleShooterPickup,
        MissileLauncherPickup,
        HealthPickup
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
        MissileLauncher
    }

    [Type]
    public enum ProjectileType : byte
    {
        Normal,
        Missile
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
        public ProjectileType ProjectileType;
        public float LifetimeSeconds;
    }
}
