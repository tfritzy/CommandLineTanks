using SpacetimeDB;
using System;

public static partial class Module
{
    [Reducer]
    public static void smokescreen(ReducerContext ctx, string worldId)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        if (tank.SmokescreenCooldownEnd > (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch)
        {
            return;
        }

        int collisionRegionX = (int)(tank.PositionX / COLLISION_REGION_SIZE);
        int collisionRegionY = (int)(tank.PositionY / COLLISION_REGION_SIZE);

        var smokeCloudId = Module.GenerateId(ctx, "smoke");
        var smokeCloud = new SmokeCloud
        {
            Id = smokeCloudId,
            WorldId = worldId,
            PositionX = tank.PositionX,
            PositionY = tank.PositionY,
            CollisionRegionX = collisionRegionX,
            CollisionRegionY = collisionRegionY,
            SpawnedAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
            Radius = SMOKESCREEN_RADIUS
        };
        ctx.Db.smoke_cloud.Insert(smokeCloud);

        ulong expirationTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch + (ulong)SMOKESCREEN_DURATION_MICROS;
        ScheduleSmokeCloudCleanup(ctx, worldId, smokeCloudId, expirationTime);

        var updatedSourceTank = tank with
        {
            SmokescreenCooldownEnd = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch + (ulong)SMOKESCREEN_COOLDOWN_MICROS
        };
        ctx.Db.tank.Id.Update(updatedSourceTank);

        Log.Info($"Tank {tank.Name} deployed smokescreen at ({tank.PositionX}, {tank.PositionY})");
    }
}
