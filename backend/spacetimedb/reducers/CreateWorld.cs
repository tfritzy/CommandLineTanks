using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void createWorld(ReducerContext ctx, string joinCode, WorldVisibility visibility, int botCount, long gameDurationMicros, int width, int height)
    {
        Log.Info($"{ctx.Sender} is creating a world (visibility: {visibility}, bots: {botCount}, size: {width}x{height})");

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var worldId = GenerateWorldId(ctx);

        var (baseTerrain, terrainDetails, traversibilityMap) = GenerateTerrainCommand(ctx, width, height);

        var world = CreateWorld(
            ctx,
            worldId,
            baseTerrain,
            terrainDetails,
            traversibilityMap,
            width,
            height,
            visibility,
            gameDurationMicros,
            ctx.Sender
        );

        CleanupHomeworldAndJoinCommand(ctx, world.Id, joinCode);

        int botsPerAlliance = botCount / 2;
        int extraBot = botCount % 2;
        
        for (int alliance = 0; alliance < 2; alliance++)
        {
            int botsForThisAlliance = botsPerAlliance + (alliance == 0 ? extraBot : 0);
            
            for (int i = 0; i < botsForThisAlliance; i++)
            {
                var targetCode = AllocateTargetCode(ctx, worldId);
                if (targetCode == null) continue;

                var (spawnX, spawnY) = FindSpawnPosition(ctx, world, alliance, ctx.Rng);
                var botName = $"Bot{ctx.Rng.Next(1000, 10000)}";
                var (botTank, botTransform) = BuildTank(
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
                AddTankToWorld(ctx, botTank, botTransform);
            }
        }

        Log.Info($"Player {player.Value.Name} created world ({world.Id})");
    }
}
