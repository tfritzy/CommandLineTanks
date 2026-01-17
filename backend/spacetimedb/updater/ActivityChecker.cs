using SpacetimeDB;
using System.Collections.Generic;
using static Types;

public static partial class Module
{
    private const long HOMEWORLD_INACTIVITY_TIMEOUT_MICROS = 30_000_000;
    private const long HOMEWORLD_ACTIVITY_CHECK_INTERVAL_MICROS = 30_000_000;
    private const long REAL_GAME_INACTIVITY_TIMEOUT_MICROS = 60_000_000;

    [Table(Scheduled = nameof(CheckGameActivity))]
    public partial struct ScheduledGameActivityCheck
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
    }

    [Reducer]
    public static void CheckGameActivity(ReducerContext ctx, ScheduledGameActivityCheck args)
    {
        var currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;

        foreach (var game in ctx.Db.game.Iter())
        {
            if (game.GameType == GameType.Home || game.GameType == GameType.Tutorial)
            {
                Tank? playerTank = null;
                foreach (var tank in ctx.Db.tank.GameId_IsBot.Filter((game.Id, false)))
                {
                    playerTank = tank;
                    break;
                }

                if (playerTank == null)
                {
                    continue;
                }

                var playerTransform = ctx.Db.tank_transform.TankId.Find(playerTank.Value.Id);
                if (playerTransform == null)
                {
                    continue;
                }

                var timeSinceLastUpdate = currentTime - playerTransform.Value.UpdatedAt;
                if (timeSinceLastUpdate > (ulong)HOMEWORLD_INACTIVITY_TIMEOUT_MICROS)
                {
                    PauseHomeworldUpdaters(ctx, game.Id);
                }
            }
            else
            {
                if (game.GameState != GameState.Playing)
                {
                    continue;
                }

                var tanksToRemove = new List<(Tank tank, ulong inactivityTime)>();
                foreach (var tank in ctx.Db.tank.GameId_IsBot.Filter((game.Id, false)))
                {
                    var tankTransform = ctx.Db.tank_transform.TankId.Find(tank.Id);
                    if (tankTransform == null)
                    {
                        continue;
                    }

                    var timeSinceLastUpdate = currentTime - tankTransform.Value.UpdatedAt;
                    if (timeSinceLastUpdate > (ulong)REAL_GAME_INACTIVITY_TIMEOUT_MICROS)
                    {
                        tanksToRemove.Add((tank, timeSinceLastUpdate));
                    }
                }

                foreach (var (tank, inactivityTime) in tanksToRemove)
                {
                    Log.Info($"Removing inactive tank {tank.Name} from game {game.Id} due to {(inactivityTime / 1_000_000)} seconds of inactivity");
                    RemoveTankFromGame(ctx, tank);
                }
            }
        }
    }

    private static void PauseHomeworldUpdaters(ReducerContext ctx, string gameId)
    {
        foreach (var tankUpdater in ctx.Db.ScheduledTankUpdates.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledTankUpdates.ScheduledId.Delete(tankUpdater.ScheduledId);
        }

        foreach (var projectileUpdater in ctx.Db.ScheduledProjectileUpdates.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledProjectileUpdates.ScheduledId.Delete(projectileUpdater.ScheduledId);
        }

        Log.Info($"Paused updaters for homeworld {gameId}");
    }
}
