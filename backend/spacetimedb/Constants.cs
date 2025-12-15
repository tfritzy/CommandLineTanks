using SpacetimeDB;
using static Types;

public static partial class Module
{
    public const long NETWORK_TICK_RATE_MICROS = 1_000_000 / 16;
    public const float PROJECTILE_SPEED = 7.0f;
    public const float PROJECTILE_SIZE = 0.1f;
    public const float GUN_BARREL_LENGTH = 0.4f;
    public const int TANK_HEALTH = 1000;
    public const float TANK_COLLISION_RADIUS = 0.5f;
    public const int COLLISION_REGION_SIZE = 4;
    public const int KILL_LIMIT = 100;
    public const long WORLD_RESET_DELAY_MICROS = 30_000_000;
    public const float MISSILE_TRACKING_RADIUS = 8.0f;

    public static readonly Gun BASE_GUN = new Gun
    {
        GunType = GunType.Base,
        Ammo = null,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = 20,
        TrackingStrength = 0,
        ProjectileType = ProjectileType.Normal,
        LifetimeSeconds = 10.0f
    };

    public static readonly Gun TRIPLE_SHOOTER_GUN = new Gun
    {
        GunType = GunType.TripleShooter,
        Ammo = 30,
        ProjectileCount = 3,
        SpreadAngle = 0.2f,
        Damage = 20,
        TrackingStrength = 0,
        ProjectileType = ProjectileType.Normal,
        LifetimeSeconds = 10.0f
    };

    public static readonly Gun MISSILE_LAUNCHER_GUN = new Gun
    {
        GunType = GunType.MissileLauncher,
        Ammo = 10,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = 40,
        TrackingStrength = 2.0f,
        ProjectileType = ProjectileType.Missile,
        LifetimeSeconds = 15.0f
    };
}
