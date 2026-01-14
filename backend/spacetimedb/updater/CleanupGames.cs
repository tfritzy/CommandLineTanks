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

        foreach (var game in ctx.Db.game.GameState.Filter(GameState.Results))
        {
            if (game.CreatedAt + (ulong)game.GameDurationMicros + 60_000_000 < (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch)
            {
                worldsToDelete.Add(game.Id);
            }
        }

        foreach (var gameId in worldsToDelete)
        {
            DeleteGame(ctx, gameId);
        }

        if (worldsToDelete.Count > 0)
        {
            Log.Info($"Cleaned up {worldsToDelete.Count} game(s) in Results state");
        }

        var homeworldsToDelete = new System.Collections.Generic.List<string>();

        foreach (var game in ctx.Db.game.Iter())
        {
            if (game.IsHomeGame)
            {
                var hasHumanPlayers = ctx.Db.tank.GameId.Filter(game.Id).Any(t => !t.IsBot);
                if (!hasHumanPlayers)
                {
                    homeworldsToDelete.Add(game.Id);
                }
            }
        }

        foreach (var gameId in homeworldsToDelete)
        {
            DeleteGame(ctx, gameId);
        }

        if (homeworldsToDelete.Count > 0)
        {
            Log.Info($"Cleaned up {homeworldsToDelete.Count} empty homegame(s)");
        }
    }

    private static void DeleteGame(ReducerContext ctx, string gameId)
    {
        foreach (var tank in ctx.Db.tank.GameId.Filter(gameId))
        {
            ctx.Db.tank.Id.Delete(tank.Id);
        }

        foreach (var transform in ctx.Db.tank_transform.GameId.Filter(gameId))
        {
            ctx.Db.tank_transform.TankId.Delete(transform.TankId);
        }

        foreach (var fireState in ctx.Db.tank_fire_state.GameId.Filter(gameId))
        {
            ctx.Db.tank_fire_state.TankId.Delete(fireState.TankId);
        }

        foreach (var pathState in ctx.Db.tank_path.GameId.Filter(gameId))
        {
            ctx.Db.tank_path.TankId.Delete(pathState.TankId);
        }

        foreach (var tankGun in ctx.Db.tank_gun.GameId.Filter(gameId))
        {
            ctx.Db.tank_gun.TankId.Delete(tankGun.TankId);
        }

        foreach (var projectile in ctx.Db.projectile.GameId.Filter(gameId))
        {
            ctx.Db.projectile_transform.ProjectileId.Delete(projectile.Id);
            ctx.Db.projectile.Id.Delete(projectile.Id);
        }

        foreach (var terrainDetail in ctx.Db.terrain_detail.GameId.Filter(gameId))
        {
            ctx.Db.terrain_detail.Id.Delete(terrainDetail.Id);
        }

        foreach (var pickup in ctx.Db.pickup.GameId.Filter(gameId))
        {
            ctx.Db.pickup.Id.Delete(pickup.Id);
        }

        foreach (var kill in ctx.Db.kills.GameId.Filter(gameId))
        {
            ctx.Db.kills.Id.Delete(kill.Id);
        }

        var score = ctx.Db.score.GameId.Find(gameId);
        if (score != null)
        {
            ctx.Db.score.GameId.Delete(gameId);
        }

        var traversibilityMap = ctx.Db.traversibility_map.GameId.Find(gameId);
        if (traversibilityMap != null)
        {
            ctx.Db.traversibility_map.GameId.Delete(gameId);
        }

        var projectileTraversibilityMap = ctx.Db.projectile_traversibility_map.GameId.Find(gameId);
        if (projectileTraversibilityMap != null)
        {
            ctx.Db.projectile_traversibility_map.GameId.Delete(gameId);
        }

        foreach (var tankUpdater in ctx.Db.ScheduledTankUpdates.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledTankUpdates.ScheduledId.Delete(tankUpdater.ScheduledId);
        }

        foreach (var projectileUpdater in ctx.Db.ScheduledProjectileUpdates.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledProjectileUpdates.ScheduledId.Delete(projectileUpdater.ScheduledId);
        }

        foreach (var pickupSpawn in ctx.Db.ScheduledPickupSpawn.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledPickupSpawn.ScheduledId.Delete(pickupSpawn.ScheduledId);
        }

        foreach (var worldReset in ctx.Db.ScheduledGameReset.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledGameReset.ScheduledId.Delete(worldReset.ScheduledId);
        }

        foreach (var gameEnd in ctx.Db.ScheduledGameEnd.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledGameEnd.ScheduledId.Delete(gameEnd.ScheduledId);
        }

        foreach (var enemyTankRespawnCheck in ctx.Db.ScheduledEnemyTankRespawnCheck.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledEnemyTankRespawnCheck.ScheduledId.Delete(enemyTankRespawnCheck.ScheduledId);
        }

        foreach (var aiUpdate in ctx.Db.ScheduledAIUpdate.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledAIUpdate.ScheduledId.Delete(aiUpdate.ScheduledId);
        }

        var worldToDelete = ctx.Db.game.Id.Find(gameId);
        if (worldToDelete != null)
        {
            ctx.Db.game.Id.Delete(gameId);
        }

        Log.Info($"Deleted game {gameId} and all related objects");
    }
}
