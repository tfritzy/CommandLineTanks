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
        var gamesToDelete = new System.Collections.Generic.List<string>();

        foreach (var game in ctx.Db.Game.GameState.Filter(GameState.Results))
        {
            if (game.CreatedAt + (ulong)game.GameDurationMicros + 60_000_000 < (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch)
            {
                gamesToDelete.Add(game.Id);
            }
        }

        foreach (var gameId in gamesToDelete)
        {
            DeleteGame(ctx, gameId);
        }

        if (gamesToDelete.Count > 0)
        {
            Log.Info($"Cleaned up {gamesToDelete.Count} game(s) in Results state");
        }

        var homegamesToDelete = new System.Collections.Generic.List<string>();

        foreach (var game in ctx.Db.Game.Iter())
        {
            if (game.GameType == GameType.Home || game.GameType == GameType.Tutorial)
            {
                var hasHumanPlayers = ctx.Db.Tank.GameId.Filter(game.Id).Any(t => !t.IsBot);
                if (!hasHumanPlayers)
                {
                    homegamesToDelete.Add(game.Id);
                }
            }
        }

        foreach (var gameId in homegamesToDelete)
        {
            DeleteGame(ctx, gameId);
        }

        if (homegamesToDelete.Count > 0)
        {
            Log.Info($"Cleaned up {homegamesToDelete.Count} empty homegame(s)");
        }

        var expiredRedirectOldGameIds = new System.Collections.Generic.List<string>();
        var oneHourAgoMicros = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch - (ulong)Module.REDIRECT_CLEANUP_AGE_MICROS;

        foreach (var redirect in ctx.Db.GameRedirect.Iter())
        {
            if (redirect.InsertedAt < oneHourAgoMicros)
            {
                expiredRedirectOldGameIds.Add(redirect.OldGameId);
            }
        }

        foreach (var oldGameId in expiredRedirectOldGameIds)
        {
            ctx.Db.GameRedirect.OldGameId.Delete(oldGameId);
        }

        if (expiredRedirectOldGameIds.Count > 0)
        {
            Log.Info($"Cleaned up {expiredRedirectOldGameIds.Count} old game redirect(s)");
        }
    }

    public static void DeleteGame(ReducerContext ctx, string gameId)
    {
        foreach (var tank in ctx.Db.Tank.GameId.Filter(gameId))
        {
            ctx.Db.Tank.Id.Delete(tank.Id);
        }

        foreach (var transform in ctx.Db.TankTransform.GameId.Filter(gameId))
        {
            ctx.Db.TankTransform.TankId.Delete(transform.TankId);
        }

        foreach (var pathState in ctx.Db.TankPath.GameId.Filter(gameId))
        {
            ctx.Db.TankPath.TankId.Delete(pathState.TankId);
        }

        foreach (var tankGun in ctx.Db.TankGun.GameId.Filter(gameId))
        {
            ctx.Db.TankGun.Id.Delete(tankGun.Id);
        }

        foreach (var projectile in ctx.Db.Projectile.GameId.Filter(gameId))
        {
            ctx.Db.ProjectileTransform.ProjectileId.Delete(projectile.Id);
            ctx.Db.Projectile.Id.Delete(projectile.Id);
        }

        foreach (var terrainDetail in ctx.Db.TerrainDetail.GameId.Filter(gameId))
        {
            ctx.Db.TerrainDetail.Id.Delete(terrainDetail.Id);
        }

        foreach (var pickup in ctx.Db.Pickup.GameId.Filter(gameId))
        {
            ctx.Db.Pickup.Id.Delete(pickup.Id);
        }

        foreach (var destination in ctx.Db.Destination.GameId.Filter(gameId))
        {
            ctx.Db.Destination.Id.Delete(destination.Id);
        }

        foreach (var kill in ctx.Db.Kill.GameId.Filter(gameId))
        {
            ctx.Db.Kill.Id.Delete(kill.Id);
        }

        foreach (var message in ctx.Db.Message.GameId.Filter(gameId))
        {
            ctx.Db.Message.Id.Delete(message.Id);
        }

        var score = ctx.Db.Score.GameId.Find(gameId);
        if (score != null)
        {
            ctx.Db.Score.GameId.Delete(gameId);
        }

        var traversibilityMap = ctx.Db.TraversibilityMap.GameId.Find(gameId);
        if (traversibilityMap != null)
        {
            ctx.Db.TraversibilityMap.GameId.Delete(gameId);
        }

        var projectileTraversibilityMap = ctx.Db.ProjectileTraversibilityMap.GameId.Find(gameId);
        if (projectileTraversibilityMap != null)
        {
            ctx.Db.ProjectileTraversibilityMap.GameId.Delete(gameId);
        }

        var baseTerrainLayer = ctx.Db.BaseTerrainLayer.GameId.Find(gameId);
        if (baseTerrainLayer != null)
        {
            ctx.Db.BaseTerrainLayer.GameId.Delete(gameId);
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

        foreach (var gameReset in ctx.Db.ScheduledGameReset.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledGameReset.ScheduledId.Delete(gameReset.ScheduledId);
        }

        foreach (var gameEnd in ctx.Db.ScheduledGameEnd.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledGameEnd.ScheduledId.Delete(gameEnd.ScheduledId);
        }

        foreach (var enemyTankRespawnCheck in ctx.Db.ScheduledEnemyTankRespawnCheck.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledEnemyTankRespawnCheck.ScheduledId.Delete(enemyTankRespawnCheck.ScheduledId);
        }

        foreach (var aiUpdate in ctx.Db.ScheduledTankAIUpdate.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledTankAIUpdate.ScheduledId.Delete(aiUpdate.ScheduledId);
        }

        var redirectPointingToGame = ctx.Db.GameRedirect.OldGameId.Find(gameId);
        if (redirectPointingToGame != null)
        {
            ctx.Db.GameRedirect.OldGameId.Delete(gameId);
        }

        var redirectsPointingToDeletedGame = new System.Collections.Generic.List<string>();
        foreach (var redirect in ctx.Db.GameRedirect.NewGameId.Filter(gameId))
        {
            redirectsPointingToDeletedGame.Add(redirect.OldGameId);
        }

        foreach (var oldGameId in redirectsPointingToDeletedGame)
        {
            ctx.Db.GameRedirect.OldGameId.Delete(oldGameId);
        }

        var gameToDelete = ctx.Db.Game.Id.Find(gameId);
        if (gameToDelete != null)
        {
            ctx.Db.Game.Id.Delete(gameId);
        }

        Log.Info($"Deleted game {gameId} and all related objects");
    }
}
