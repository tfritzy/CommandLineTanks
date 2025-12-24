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

        if (tank.SmokescreenCooldownEnd > ctx.Timestamp.Microseconds)
        {
            return;
        }

        var smokeCloudId = IdGenerator.GenerateId("smoke");
        var smokeCloud = new SmokeCloud
        {
            Id = smokeCloudId,
            WorldId = worldId,
            PositionX = tank.PositionX,
            PositionY = tank.PositionY,
            SpawnedAt = ctx.Timestamp.Microseconds,
            Radius = SMOKESCREEN_RADIUS
        };
        ctx.Db.smoke_cloud.Insert(smokeCloud);

        var allTanks = ctx.Db.tank.WorldId.Filter(worldId);
        foreach (var otherTank in allTanks)
        {
            if (otherTank.Target == null) continue;

            var dx = otherTank.PositionX - tank.PositionX;
            var dy = otherTank.PositionY - tank.PositionY;
            var distanceSquared = dx * dx + dy * dy;

            if (distanceSquared <= SMOKESCREEN_RADIUS * SMOKESCREEN_RADIUS)
            {
                var updatedTank = otherTank with
                {
                    Target = null
                };
                ctx.Db.tank.Id.Update(updatedTank);
            }
        }

        var updatedSourceTank = tank with
        {
            SmokescreenCooldownEnd = ctx.Timestamp.Microseconds + (ulong)SMOKESCREEN_COOLDOWN_MICROS
        };
        ctx.Db.tank.Id.Update(updatedSourceTank);

        Log.Info($"Tank {tank.Name} deployed smokescreen at ({tank.PositionX}, {tank.PositionY})");
    }
}
