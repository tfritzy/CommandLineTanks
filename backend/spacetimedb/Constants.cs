using SpacetimeDB;
using static Types;

public static partial class Module
{
    public const long NETWORK_TICK_RATE_MICROS = 1_000_000 / 16;
    public const float PROJECTILE_SPEED = 7.0f;
    public const float PROJECTILE_SIZE = 0.3f;
    public const float GUN_BARREL_LENGTH = 0.4f;
    public const int TANK_HEALTH = 100;
    public const int PROJECTILE_DAMAGE = 20;
    public const int MISSILE_DAMAGE = 40;
    public const int COLLISION_REGION_SIZE = 4;
    public const int KILL_LIMIT = 100;
    public const long WORLD_RESET_DELAY_MICROS = 30_000_000;
    public const int TRIPLE_SHOOTER_AMMO = 30;
    public const int MISSILE_LAUNCHER_AMMO = 10;
    public const float MISSILE_TRACKING_RADIUS = 8.0f;

    public static readonly Gun BASE_GUN = new Gun
    {
        GunType = GunType.Base,
        Ammo = null,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = PROJECTILE_DAMAGE,
        TrackingStrength = 0,
        ProjectileType = ProjectileType.Normal,
        Selected = true
    };

    public static readonly Gun TRIPLE_SHOOTER_GUN = new Gun
    {
        GunType = GunType.TripleShooter,
        Ammo = TRIPLE_SHOOTER_AMMO,
        ProjectileCount = 3,
        SpreadAngle = 0.2f,
        Damage = PROJECTILE_DAMAGE,
        TrackingStrength = 0,
        ProjectileType = ProjectileType.Normal,
        Selected = false
    };

    public static readonly Gun MISSILE_LAUNCHER_GUN = new Gun
    {
        GunType = GunType.MissileLauncher,
        Ammo = MISSILE_LAUNCHER_AMMO,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = MISSILE_DAMAGE,
        TrackingStrength = 2.0f,
        ProjectileType = ProjectileType.Missile,
        Selected = false
    };
}
