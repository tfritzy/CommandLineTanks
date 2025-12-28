using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Table(Scheduled = nameof(CleanupResultsGames))]
    public partial struct ScheduledGameCleanup
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
    }

    [Reducer]
    public static void CleanupResultsGames(ReducerContext ctx, ScheduledGameCleanup args)
    {
        var worldsToDelete = new System.Collections.Generic.List<string>();

        foreach (var world in ctx.Db.world.GameState.Filter(GameState.Results))
        {
            if (world.CreatedAt + (ulong)world.GameDurationMicros + 60_000_000 < (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch)
            {
                worldsToDelete.Add(world.Id);
            }
        }

        foreach (var worldId in worldsToDelete)
        {
            DeleteWorld(ctx, worldId);
        }

        if (worldsToDelete.Count > 0)
        {
            Log.Info($"Cleaned up {worldsToDelete.Count} game(s) in Results state");
        }
    }

    private static void DeleteWorld(ReducerContext ctx, string worldId)
    {
        foreach (var tank in ctx.Db.tank.WorldId.Filter(worldId))
        {
            ctx.Db.tank.Id.Delete(tank.Id);
        }

        foreach (var fireState in ctx.Db.tank_fire_state.WorldId.Filter(worldId))
        {
            ctx.Db.tank_fire_state.TankId.Delete(fireState.TankId);
        }

        foreach (var pathState in ctx.Db.tank_path.WorldId.Filter(worldId))
        {
            ctx.Db.tank_path.TankId.Delete(pathState.TankId);
        }

        foreach (var projectile in ctx.Db.projectile.WorldId.Filter(worldId))
        {
            ctx.Db.projectile.Id.Delete(projectile.Id);
        }

        foreach (var terrainDetail in ctx.Db.terrain_detail.WorldId.Filter(worldId))
        {
            ctx.Db.terrain_detail.Id.Delete(terrainDetail.Id);
        }

        foreach (var pickup in ctx.Db.pickup.WorldId.Filter(worldId))
        {
            ctx.Db.pickup.Id.Delete(pickup.Id);
        }

        foreach (var spiderMine in ctx.Db.spider_mine.WorldId.Filter(worldId))
        {
            ctx.Db.spider_mine.Id.Delete(spiderMine.Id);
        }

        foreach (var kill in ctx.Db.kills.WorldId.Filter(worldId))
        {
            ctx.Db.kills.Id.Delete(kill.Id);
        }

        foreach (var smokeCloud in ctx.Db.smoke_cloud.WorldId.Filter(worldId))
        {
            ctx.Db.smoke_cloud.Id.Delete(smokeCloud.Id);
        }

        var score = ctx.Db.score.WorldId.Find(worldId);
        if (score != null)
        {
            ctx.Db.score.WorldId.Delete(worldId);
        }

        var traversibilityMap = ctx.Db.traversibility_map.WorldId.Find(worldId);
        if (traversibilityMap != null)
        {
            ctx.Db.traversibility_map.WorldId.Delete(worldId);
        }

        foreach (var tankUpdater in ctx.Db.ScheduledTankUpdates.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledTankUpdates.ScheduledId.Delete(tankUpdater.ScheduledId);
        }

        foreach (var projectileUpdater in ctx.Db.ScheduledProjectileUpdates.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledProjectileUpdates.ScheduledId.Delete(projectileUpdater.ScheduledId);
        }

        foreach (var pickupSpawn in ctx.Db.ScheduledPickupSpawn.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledPickupSpawn.ScheduledId.Delete(pickupSpawn.ScheduledId);
        }

        foreach (var spiderMineUpdate in ctx.Db.ScheduledSpiderMineUpdates.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledSpiderMineUpdates.ScheduledId.Delete(spiderMineUpdate.ScheduledId);
        }

        foreach (var worldReset in ctx.Db.ScheduledWorldReset.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledWorldReset.ScheduledId.Delete(worldReset.ScheduledId);
        }

        foreach (var gameEnd in ctx.Db.ScheduledGameEnd.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledGameEnd.ScheduledId.Delete(gameEnd.ScheduledId);
        }

        foreach (var smokeCloudCleanup in ctx.Db.ScheduledSmokeCloudCleanup.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledSmokeCloudCleanup.ScheduledId.Delete(smokeCloudCleanup.ScheduledId);
        }

        foreach (var enemyTankRespawnCheck in ctx.Db.ScheduledEnemyTankRespawnCheck.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledEnemyTankRespawnCheck.ScheduledId.Delete(enemyTankRespawnCheck.ScheduledId);
        }

        var worldToDelete = ctx.Db.world.Id.Find(worldId);
        if (worldToDelete != null)
        {
            ctx.Db.world.Id.Delete(worldId);
        }

        Log.Info($"Deleted world {worldId} and all related objects");
    }
}
