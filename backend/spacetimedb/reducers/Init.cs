using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer(ReducerKind.Init)]
    public static void Init(ReducerContext ctx)
    {
        var worldId = GenerateId(ctx, "wld");

        var width = TerrainGenerator.GetWorldWidth();
        var height = TerrainGenerator.GetWorldHeight();
        var (baseTerrain, terrainDetails) = TerrainGenerator.GenerateTerrain(ctx.Rng, width, height);
        var terrainDetailArray = TerrainGenerator.ConvertToArray(
            terrainDetails,
            width,
            height
        );
        var traversibilityMap = TerrainGenerator.CalculateTraversibility(baseTerrain, terrainDetailArray);

        var world = CreateWorld(ctx, worldId, "Default World", baseTerrain, terrainDetails.ToArray(), traversibilityMap, width, height);

        SpawnInitialBots(ctx, worldId, world);

        ctx.Db.ScheduledGameCleanup.Insert(new ScheduledGameCleanup
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = 300_000_000 })
        });

        Log.Info($"Initialized world {worldId}");
    }

    public static void SpawnInitialBots(ReducerContext ctx, string worldId, World world)
    {
        for (int alliance = 0; alliance < 2; alliance++)
        {
            for (int i = 0; i < 2; i++)
            {
                var targetCode = AllocateTargetCode(ctx, worldId);
                if (targetCode == null) continue;

                var (spawnX, spawnY) = FindSpawnPosition(ctx, world, alliance, ctx.Rng);
                var botName = $"Bot{ctx.Rng.Next(1000, 10000)}";
                var botTank = BuildTank(
                    ctx: ctx,
                    worldId: worldId,
                    owner: Identity.From(new byte[32]),
                    name: botName,
                    targetCode: targetCode,
                    joinCode: "",
                    alliance: alliance,
                    positionX: spawnX,
                    positionY: spawnY,
                    aiBehavior: AIBehavior.GameAI);
                AddTankToWorld(ctx, botTank);
            }
        }

        Log.Info($"Spawned initial bot tanks for world {worldId}");
    }
}
