using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void respawn(ReducerContext ctx, string worldId)
    {
        Tank? maybeTank = ctx.Db.tank.WorldId_Owner.Filter((worldId, ctx.Sender)).FirstOrDefault();
        if (maybeTank == null) return;
        var tank = maybeTank.Value;

        if (!tank.IsDead) return;

        World? maybeWorld = ctx.Db.world.Id.Find(worldId);
        if (maybeWorld == null) return;
        var world = maybeWorld.Value;

        var (spawnX, spawnY) = FindSpawnPosition(ctx, world, tank.Alliance, ctx.Rng);

        var respawnedTank = tank with
        {
            Health = Module.TANK_HEALTH,
            MaxHealth = Module.TANK_HEALTH,
            IsDead = false,
            PositionX = spawnX,
            PositionY = spawnY,
            Path = [],
            Velocity = new Vector2Float(0, 0),
            BodyAngularVelocity = 0,
            TurretAngularVelocity = 0,
            Guns = [BASE_GUN],
            SelectedGunIndex = 0
        };

        ctx.Db.tank.Id.Update(respawnedTank);
        Log.Info($"Tank {tank.Name} respawned at position ({spawnX}, {spawnY})");
    }
}
