using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    [Table(Name = "projectile", Public = true)]
    public partial struct Projectile
    {
        [PrimaryKey]
        [AutoInc]
        public ulong Id;

        [SpacetimeDB.Index.BTree]
        public string WorldId;

        public string ShooterTankId;

        public int Alliance;

        public float Size;

        public int Damage;
        public float TrackingStrength;
        public float TrackingRadius;
        public ProjectileType ProjectileType;
        public ulong SpawnedAt;
        public float LifetimeSeconds;
        public bool ReturnsToShooter;
        public int MaxCollisions;
        public bool PassThroughTerrain;
        public float CollisionRadius;
        public float? ExplosionRadius;
        public ExplosionTrigger ExplosionTrigger;
        public float? Damping;
        public bool Bounce;

        public float Speed;
        public bool IsReturning;
        public DamagedTile[] RecentlyDamagedTiles;
        public DamagedTank[] RecentlyHitTanks;
    }

    public static (Projectile, ProjectileTransform) BuildProjectile(
        ReducerContext ctx,
        string? worldId = null,
        string? shooterTankId = null,
        int alliance = 0,
        float positionX = 0,
        float positionY = 0,
        float speed = 0,
        float size = 0.15f,
        Vector2Float? velocity = null,
        int damage = 20,
        float trackingStrength = 0,
        float trackingRadius = 0,
        ProjectileType projectileType = ProjectileType.Normal,
        ulong? spawnedAt = null,
        float lifetimeSeconds = 10.0f,
        bool returnsToShooter = false,
        bool isReturning = false,
        int maxCollisions = 1,
        int collisionCount = 0,
        bool passThroughTerrain = false,
        float collisionRadius = 0.1f,
        float? explosionRadius = null,
        ExplosionTrigger explosionTrigger = ExplosionTrigger.None,
        float? damping = null,
        bool bounce = false,
        DamagedTile[]? recentlyDamagedTiles = null,
        DamagedTank[]? recentlyHitTanks = null)
    {
        var timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;

        var projectile = new Projectile
        {
            WorldId = worldId ?? "",
            ShooterTankId = shooterTankId ?? "",
            Alliance = alliance,
            Size = size,
            Damage = damage,
            TrackingStrength = trackingStrength,
            TrackingRadius = trackingRadius,
            ProjectileType = projectileType,
            SpawnedAt = spawnedAt ?? timestamp,
            LifetimeSeconds = lifetimeSeconds,
            ReturnsToShooter = returnsToShooter,
            MaxCollisions = maxCollisions,
            PassThroughTerrain = passThroughTerrain,
            CollisionRadius = collisionRadius,
            ExplosionRadius = explosionRadius,
            ExplosionTrigger = explosionTrigger,
            Damping = damping,
            Bounce = bounce,
            Speed = speed,
            IsReturning = isReturning,
            RecentlyDamagedTiles = recentlyDamagedTiles ?? Array.Empty<DamagedTile>(),
            RecentlyHitTanks = recentlyHitTanks ?? Array.Empty<DamagedTank>()
        };

        var transform = new ProjectileTransform
        {
            WorldId = worldId ?? "",
            PositionX = positionX,
            PositionY = positionY,
            Velocity = velocity ?? new Vector2Float(0, 0),
            CollisionCount = collisionCount
        };

        return (projectile, transform);
    }
}
