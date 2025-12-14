using SpacetimeDB;

public static partial class Module
{
    public const long NETWORK_TICK_RATE_MICROS = 1_000_000 / 16;
    public const float PROJECTILE_SPEED = 7.0f;
    public const float PROJECTILE_SIZE = 0.3f;
    public const float GUN_BARREL_LENGTH = 0.4f;
    public const int TANK_HEALTH = 100;
    public const int PROJECTILE_DAMAGE = 20;
    public const int COLLISION_REGION_SIZE = 4;
    public const int KILL_LIMIT = 100;
    public const long WORLD_RESET_DELAY_MICROS = 30_000_000;
}
