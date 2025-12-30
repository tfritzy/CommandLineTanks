using SpacetimeDB;
using System.Linq;
using System.Collections.Generic;
using static Types;

public static partial class Module
{
    [Table(Scheduled = nameof(ResetWorld))]
    public partial struct ScheduledWorldReset
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        [SpacetimeDB.Index.BTree]
        public string WorldId;
    }

    public static bool HasAnyTanksInWorld(ReducerContext ctx, string worldId)
    {
        return ctx.Db.tank.WorldId.Filter(worldId).Any();
    }

    public static void StopWorldTickers(ReducerContext ctx, string worldId)
    {
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

        foreach (var enemyTankRespawnCheck in ctx.Db.ScheduledEnemyTankRespawnCheck.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledEnemyTankRespawnCheck.ScheduledId.Delete(enemyTankRespawnCheck.ScheduledId);
        }

        foreach (var worldReset in ctx.Db.ScheduledWorldReset.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledWorldReset.ScheduledId.Delete(worldReset.ScheduledId);
        }

        foreach (var aiUpdate in ctx.Db.ScheduledAIUpdate.WorldId.Filter(worldId))
        {
            ctx.Db.ScheduledAIUpdate.ScheduledId.Delete(aiUpdate.ScheduledId);
        }

        Log.Info($"Stopped tickers for world {worldId}");
    }

    public static void StartWorldTickers(ReducerContext ctx, string worldId)
    {
        if (!ctx.Db.ScheduledTankUpdates.WorldId.Filter(worldId).Any())
        {
            ctx.Db.ScheduledTankUpdates.Insert(new TankUpdater.ScheduledTankUpdates
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
                WorldId = worldId,
                LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch,
                TickCount = 0
            });
        }

        if (!ctx.Db.ScheduledProjectileUpdates.WorldId.Filter(worldId).Any())
        {
            ctx.Db.ScheduledProjectileUpdates.Insert(new ProjectileUpdater.ScheduledProjectileUpdates
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = NETWORK_TICK_RATE_MICROS }),
                WorldId = worldId,
                LastTickAt = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
            });
        }

        if (!ctx.Db.ScheduledSpiderMineUpdates.WorldId.Filter(worldId).Any())
        {
            SpiderMineUpdater.InitializeSpiderMineUpdater(ctx, worldId);
        }

        if (!ctx.Db.ScheduledAIUpdate.WorldId.Filter(worldId).Any())
        {
            ctx.Db.ScheduledAIUpdate.Insert(new BehaviorTreeAI.ScheduledAIUpdate
            {
                ScheduledId = 0,
                ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = AI_UPDATE_INTERVAL_MICROS }),
                WorldId = worldId,
                TickCount = 0
            });
        }

        Log.Info($"Started tickers for world {worldId}");
    }

    [Reducer]
    public static void ResetWorld(ReducerContext ctx, ScheduledWorldReset args)
    {
        var oldWorld = ctx.Db.world.Id.Find(args.WorldId);
        if (oldWorld == null) return;

        var tanks = new List<Module.Tank>();
        foreach (var tank in ctx.Db.tank.WorldId.Filter(args.WorldId))
        {
            if (!tank.IsBot)
            {
                tanks.Add(tank);
            }
        }

        int totalTanks = tanks.Count;
        
        if (totalTanks == 0)
        {
            Log.Info($"No real players left in world {args.WorldId}, not creating new world");
            return;
        }

        Log.Info($"Resetting world {args.WorldId} by creating new world...");

        var width = TerrainGenerator.GetWorldWidth();
        var height = TerrainGenerator.GetWorldHeight();
        var (baseTerrain, terrainDetails) = TerrainGenerator.GenerateTerrain(ctx.Rng, width, height);
        var terrainDetailArray = TerrainGenerator.ConvertToArray(
            terrainDetails,
            width,
            height
        );
        var traversibilityMap = TerrainGenerator.CalculateTraversibility(baseTerrain, terrainDetailArray);
        var projectileCollisionMap = TerrainGenerator.CalculateProjectileCollisionMap(baseTerrain, terrainDetailArray);

        var newWorldId = Module.GenerateId(ctx, "w");
        var newWorld = CreateWorld(ctx, newWorldId, oldWorld.Value.Name, baseTerrain, terrainDetails.ToArray(), traversibilityMap, projectileCollisionMap, width, height);

        SpawnInitialBots(ctx, newWorldId, newWorld);
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
            var tank = tanks[tankIndex];

            int newAlliance = i < (totalTanks + 1) / 2 ? 0 : 1;

            var (spawnX, spawnY) = FindSpawnPosition(ctx, newWorld, newAlliance, ctx.Rng);

            var newTank = BuildTank(
                ctx,
                newWorldId,
                tank.Owner,
                tank.Name,
                tank.TargetCode,
                args.WorldId,
                newAlliance,
                spawnX,
                spawnY,
                AIBehavior.None);
            AddTankToWorld(ctx, newTank);
        }

        Log.Info($"Created new world {newWorldId} from {args.WorldId}. Teams randomized, {totalTanks} tanks created.");
    }
}
