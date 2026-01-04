using SpacetimeDB;
using System;

public static partial class Module
{
    [Reducer]
    public static void smoke(ReducerContext ctx, string worldId)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (tank.Health <= 0) return;

        if (tank.RemainingSmokescreenCooldownMicros > 0)
        {
            return;
        }

        int collisionRegionX = (int)(tank.PositionX / COLLISION_REGION_SIZE);
        int collisionRegionY = (int)(tank.PositionY / COLLISION_REGION_SIZE);

        var smokeCloudId = Module.GenerateId(ctx, "smoke");
        var smokeCloud = SmokeCloud.Build(
            ctx: ctx,
            id: smokeCloudId,
            worldId: worldId,
            positionX: tank.PositionX,
            positionY: tank.PositionY,
            collisionRegionX: collisionRegionX,
            collisionRegionY: collisionRegionY
        );
        ctx.Db.smoke_cloud.Insert(smokeCloud);

        ulong expirationTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch + (ulong)SMOKESCREEN_DURATION_MICROS;
        ScheduleSmokeCloudCleanup(ctx, worldId, smokeCloudId, expirationTime);

        var updatedSourceTank = tank with
        {
            RemainingSmokescreenCooldownMicros = SMOKESCREEN_COOLDOWN_MICROS
        };
        ctx.Db.tank.Id.Update(updatedSourceTank);

        Log.Info($"Tank {tank.Name} deployed smoke at ({tank.PositionX}, {tank.PositionY})");
    }

    [Reducer]
    public static void smokescreen(ReducerContext ctx, string worldId)
    {
        smoke(ctx, worldId);
    }
}
