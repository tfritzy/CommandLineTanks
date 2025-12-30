using SpacetimeDB;
using static Types;

public static partial class Module
{
    public const long NETWORK_TICK_RATE_MICROS = 1_000_000 / 30;
    public const long AI_UPDATE_INTERVAL_MICROS = 1_000_000;
    public const float PROJECTILE_SPEED = 7.0f;
    public const float SNIPER_PROJECTILE_SPEED = 15.0f;
    public const float GUN_BARREL_LENGTH = 0.4f;
    public const int TANK_HEALTH = 100;
    public const float TANK_COLLISION_RADIUS = 0.5f;
    public const int COLLISION_REGION_SIZE = 4;
    public const long WORLD_RESET_DELAY_MICROS = 30_000_000;
    public const float MISSILE_TRACKING_RADIUS = 5.5f;
    public const long GAME_DURATION_MICROS = 600_000_000;
    public const long COUNTDOWN_MICROS = 10_000_000;
    public const float MAX_TARGETING_RANGE = 18.0f;
    public const ulong FIRE_RATE_LIMIT_MICROS = 100_000;
    public const long SMOKESCREEN_COOLDOWN_MICROS = 60_000_000;
    public const float SMOKESCREEN_RADIUS = 3.0f;
    public const long SMOKESCREEN_DURATION_MICROS = 5_000_000;
    public const long OVERDRIVE_COOLDOWN_MICROS = 60_000_000;
    public const long OVERDRIVE_DURATION_MICROS = 10_000_000;
    public const float OVERDRIVE_SPEED_MULTIPLIER = 1.25f;
    public const long SPAWN_IMMUNITY_DURATION_MICROS = 3_000_000;
    public const long REPAIR_COOLDOWN_MICROS = 60_000_000;
    public const int REPAIR_HEALTH_PER_TICK = 1;
    public const int REPAIR_TICK_INTERVAL = 2;

    public const long BOT_RESPAWN_DELAY_MICROS = 5_000_000;

    public static readonly Gun BASE_GUN = new Gun
    {
        GunType = GunType.Base,
        Ammo = null,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = 20,
        TrackingStrength = 0,
        TrackingRadius = 0,
        ProjectileType = ProjectileType.Normal,
        LifetimeSeconds = 10.0f,
        MaxCollisions = 1,
        PassThroughTerrain = false,
        CollisionRadius = 0.1f,
        ExplosionRadius = null,
        ExplosionTrigger = ExplosionTrigger.None,
        Damping = null,
        Bounce = false,
        ProjectileSize = .15f,
        ProjectileSpeed = PROJECTILE_SPEED,
    };

    public static readonly Gun TRIPLE_SHOOTER_GUN = new Gun
    {
        GunType = GunType.TripleShooter,
        Ammo = 30,
        ProjectileCount = 3,
        SpreadAngle = 0.2f,
        Damage = 20,
        TrackingStrength = 0,
        TrackingRadius = 0,
        ProjectileType = ProjectileType.Normal,
        LifetimeSeconds = 10.0f,
        MaxCollisions = 1,
        PassThroughTerrain = false,
        CollisionRadius = 0.1f,
        ExplosionRadius = null,
        ExplosionTrigger = ExplosionTrigger.None,
        Damping = null,
        Bounce = false,
        ProjectileSize = .15f,
        ProjectileSpeed = PROJECTILE_SPEED,
    };

    public static readonly Gun MISSILE_LAUNCHER_GUN = new Gun
    {
        GunType = GunType.MissileLauncher,
        Ammo = 10,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = 40,
        TrackingStrength = 2.0f,
        TrackingRadius = MISSILE_TRACKING_RADIUS,
        ProjectileType = ProjectileType.Missile,
        LifetimeSeconds = 15.0f,
        MaxCollisions = 1,
        PassThroughTerrain = false,
        CollisionRadius = 0.1f,
        ExplosionRadius = null,
        ExplosionTrigger = ExplosionTrigger.None,
        Damping = null,
        Bounce = false,
        ProjectileSize = .2f,
        ProjectileSpeed = PROJECTILE_SPEED,
    };

    public static readonly Gun BOOMERANG_GUN = new Gun
    {
        GunType = GunType.Boomerang,
        Ammo = 1,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = 50,
        TrackingStrength = 0,
        TrackingRadius = 0,
        ProjectileType = ProjectileType.Boomerang,
        LifetimeSeconds = 3.0f,
        MaxCollisions = 10,
        PassThroughTerrain = true,
        CollisionRadius = 0.1f,
        ExplosionRadius = null,
        ExplosionTrigger = ExplosionTrigger.None,
        Damping = null,
        Bounce = false,
        ProjectileSize = .3f,
        ProjectileSpeed = PROJECTILE_SPEED,
    };

    public static readonly Gun GRENADE_GUN = new Gun
    {
        GunType = GunType.Grenade,
        Ammo = 5,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = 100,
        TrackingStrength = 0,
        TrackingRadius = 0,
        ProjectileType = ProjectileType.Grenade,
        LifetimeSeconds = 2.0f,
        MaxCollisions = 9999,
        PassThroughTerrain = false,
        CollisionRadius = 0.1f,
        ExplosionRadius = 1.5f,
        ExplosionTrigger = ExplosionTrigger.OnExpiration,
        Damping = 0.3f,
        Bounce = true,
        ProjectileSize = .3f,
        ProjectileSpeed = PROJECTILE_SPEED,
    };

    public static readonly Gun ROCKET_GUN = new Gun
    {
        GunType = GunType.Rocket,
        Ammo = 8,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = 100,
        TrackingStrength = 0,
        TrackingRadius = 0,
        ProjectileType = ProjectileType.Rocket,
        LifetimeSeconds = 10.0f,
        MaxCollisions = 1,
        PassThroughTerrain = false,
        CollisionRadius = 0.1f,
        ExplosionRadius = 1.5f,
        ExplosionTrigger = ExplosionTrigger.OnHit,
        Damping = null,
        Bounce = false,
        ProjectileSize = .2f,
        ProjectileSpeed = PROJECTILE_SPEED,
    };

    public static readonly Gun MOAG_GUN = new Gun
    {
        GunType = GunType.Moag,
        Ammo = 1,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = 100,
        TrackingStrength = 0,
        TrackingRadius = 0,
        ProjectileType = ProjectileType.Moag,
        LifetimeSeconds = 20.0f,
        MaxCollisions = 999,
        PassThroughTerrain = true,
        CollisionRadius = 1f,
        ExplosionRadius = null,
        ExplosionTrigger = ExplosionTrigger.None,
        Damping = null,
        Bounce = false,
        ProjectileSize = 1f,
        ProjectileSpeed = PROJECTILE_SPEED,
    };

    public static readonly Gun SNIPER_GUN = new Gun
    {
        GunType = GunType.Sniper,
        Ammo = 10,
        ProjectileCount = 1,
        SpreadAngle = 0,
        Damage = 20,
        TrackingStrength = 0,
        TrackingRadius = 0,
        ProjectileType = ProjectileType.Sniper,
        LifetimeSeconds = 10.0f,
        MaxCollisions = 1,
        PassThroughTerrain = false,
        CollisionRadius = 0.1f,
        ExplosionRadius = null,
        ExplosionTrigger = ExplosionTrigger.None,
        Damping = null,
        Bounce = false,
        ProjectileSize = .15f,
        ProjectileSpeed = SNIPER_PROJECTILE_SPEED,
    };
}
