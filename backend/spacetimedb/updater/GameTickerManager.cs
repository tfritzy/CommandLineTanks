using SpacetimeDB;
using System.Linq;
using System.Collections.Generic;
using static Types;

public static partial class Module
{
    [Table(Scheduled = nameof(ResetGame))]
    public partial struct ScheduledGameReset
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string GameId;
    }

    public static bool HasAnyTanksInGame(ReducerContext ctx, string gameId)
    {
        return ctx.Db.tank.GameId.Filter(gameId).Any();
    }

    public static void StopGameTickers(ReducerContext ctx, string gameId)
    {
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

        foreach (var enemyTankRespawnCheck in ctx.Db.ScheduledEnemyTankRespawnCheck.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledEnemyTankRespawnCheck.ScheduledId.Delete(enemyTankRespawnCheck.ScheduledId);
        }

        foreach (var gameReset in ctx.Db.ScheduledGameReset.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledGameReset.ScheduledId.Delete(gameReset.ScheduledId);
        }

        foreach (var aiUpdate in ctx.Db.ScheduledAIUpdate.GameId.Filter(gameId))
        {
            ctx.Db.ScheduledAIUpdate.ScheduledId.Delete(aiUpdate.ScheduledId);
        }

        Log.Info($"Stopped tickers for game {gameId}");
    }

    public static void StartGameTickers(ReducerContext ctx, string gameId)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        bool isHomeGame = game != null && game.Value.IsHomeGame;

        if (!isHomeGame && !ctx.Db.ScheduledTankUpdates.GameId.Filter(gameId).Any())
        {
            ctx.Db.ScheduledTankUpdates.Insert(new TankUpdater.ScheduledTankUpdates
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
                GameId = gameId,
                LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
                TickCount = 0
            });
        }

        if (!isHomeGame && !ctx.Db.ScheduledProjectileUpdates.GameId.Filter(gameId).Any())
        {
            ctx.Db.ScheduledProjectileUpdates.Insert(new ProjectileUpdater.ScheduledProjectileUpdates
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
                GameId = gameId,
                LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
            });
        }

        if (!ctx.Db.ScheduledAIUpdate.GameId.Filter(gameId).Any())
        {
            ctx.Db.ScheduledAIUpdate.Insert(new BehaviorTreeAI.ScheduledAIUpdate
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = AI_UPDATE_INTERVAL_MICROS }),
                GameId = gameId,
                TickCount = 0
            });
        }

        Log.Info($"Started tickers for game {gameId}");
    }

    [Reducer]
    public static void ResetGame(ReducerContext ctx, ScheduledGameReset args)
    {
        var oldGame = ctx.Db.game.Id.Find(args.GameId);
        if (oldGame == null) return;

        var playerMetadatas = new List<Module.Tank>();
        foreach (var metadata in ctx.Db.tank.GameId.Filter(args.GameId))
        {
            if (!metadata.IsBot)
            {
                playerMetadatas.Add(metadata);
            }
        }

        int totalTanks = playerMetadatas.Count;
        
        if (totalTanks == 0)
        {
            Log.Info($"No real players left in game {args.GameId}, not creating new game");
            return;
        }

        Log.Info($"Resetting game {args.GameId} by creating new game...");

        var width = TerrainGenerator.GetGameWidth();
        var height = TerrainGenerator.GetGameHeight();
        var (baseTerrain, terrainDetails, traversibilityMap) = GenerateTerrainCommand(ctx, width, height);

        var newGameId = Module.GenerateGameId(ctx);
        var newGame = CreateGame(ctx, newGameId, baseTerrain, terrainDetails, traversibilityMap, width, height);

        SpawnInitialBots(ctx, newGameId, newGame);
        var shuffledIndices = new int[totalTanks];
        for (int i = 0; i < totalTanks; i++)
        {
            shuffledIndices[i] = i;
        }

        for (int i = totalTanks - 1; i > 0; i--)
        {
            int j = ctx.Rng.Next(i + 1);
            int temp = shuffledIndices[i];
            shuffledIndices[i] = shuffledIndices[j];
            shuffledIndices[j] = temp;
        }

        for (int i = 0; i < totalTanks; i++)
        {
            int tankIndex = shuffledIndices[i];
            var oldMetadata = playerMetadatas[tankIndex];

            int newAlliance = i < (totalTanks + 1) / 2 ? 0 : 1;

            var (spawnX, spawnY) = FindSpawnPosition(ctx, newGame, newAlliance, ctx.Rng);

            var (newTank, newTransform) = BuildTank(
                ctx: ctx,
                gameId: newGameId,
                owner: oldMetadata.Owner,
                name: oldMetadata.Name,
                targetCode: oldMetadata.TargetCode,
                joinCode: args.GameId,
                alliance: newAlliance,
                positionX: spawnX,
                positionY: spawnY,
                aiBehavior: AIBehavior.None);
            AddTankToGame(ctx, newTank, newTransform);
        }

        Log.Info($"Created new game {newGameId} from {args.GameId}. Teams randomized, {totalTanks} tanks created.");
    }
}
