using SpacetimeDB;
using static Types;

public static partial class Module
{
    public partial struct SmokeCloud
    {
        public static SmokeCloud Build(
            ReducerContext ctx,
            string? id = null,
            string? worldId = null,
            float positionX = 0,
            float positionY = 0,
            int collisionRegionX = 0,
            int collisionRegionY = 0,
            ulong? spawnedAt = null,
            float radius = SMOKESCREEN_RADIUS)
        {
            var timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
            
            return new SmokeCloud
            {
                Id = id ?? GenerateId(ctx, "smoke"),
                WorldId = worldId ?? "",
                PositionX = positionX,
                PositionY = positionY,
                CollisionRegionX = collisionRegionX,
                CollisionRegionY = collisionRegionY,
                SpawnedAt = spawnedAt ?? timestamp,
                Radius = radius
            };
        }
    }
}
