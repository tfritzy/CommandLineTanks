using SpacetimeDB;
using static Types;
using System;

public static partial class Module
{
    public partial struct Projectile
    {
        public static Projectile Build(
            ReducerContext ctx,
            string? id = null,
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
            DamagedTank[]? recentlyHitTanks = null,
            ulong? updatedAt = null)
        {
            var timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
            
            return new Projectile
            {
                Id = id ?? GenerateId(ctx, "prj"),
                WorldId = worldId ?? "",
                ShooterTankId = shooterTankId ?? "",
                Alliance = alliance,
                PositionX = positionX,
                PositionY = positionY,
                Speed = speed,
                Size = size,
                Velocity = velocity ?? new Vector2Float(0, 0),
                Damage = damage,
                TrackingStrength = trackingStrength,
                TrackingRadius = trackingRadius,
                ProjectileType = projectileType,
                SpawnedAt = spawnedAt ?? timestamp,
                LifetimeSeconds = lifetimeSeconds,
                ReturnsToShooter = returnsToShooter,
                IsReturning = isReturning,
                MaxCollisions = maxCollisions,
                CollisionCount = collisionCount,
                PassThroughTerrain = passThroughTerrain,
                CollisionRadius = collisionRadius,
                ExplosionRadius = explosionRadius,
                ExplosionTrigger = explosionTrigger,
                Damping = damping,
                Bounce = bounce,
                RecentlyDamagedTiles = recentlyDamagedTiles ?? new DamagedTile[0],
                RecentlyHitTanks = recentlyHitTanks ?? new DamagedTank[0],
                UpdatedAt = updatedAt ?? timestamp
            };
        }
    }
}
