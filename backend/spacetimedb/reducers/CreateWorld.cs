using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void createWorld(ReducerContext ctx, string worldName, bool isPrivate, string passcode, int botCount, long gameDurationMicros)
    {
        Log.Info($"{ctx.Sender} is creating a world '{worldName}' (private: {isPrivate}, bots: {botCount})");

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var worldId = GenerateWorldId(ctx);

        var (baseTerrain, terrainDetails, traversibilityMap, projectileCollisionMap) = GenerateTerrainCommand(ctx);

        var world = CreateWorld(
            ctx,
            worldId,
            worldName,
            baseTerrain,
            terrainDetails,
            traversibilityMap,
            projectileCollisionMap,
            isPrivate,
            passcode,
            gameDurationMicros
        );

        CleanupHomeworldAndJoinCommand(ctx, world.Id);

        for (int alliance = 0; alliance < 2; alliance++)
        {
            for (int i = 0; i < botCount / 2; i++)
            {
                var targetCode = AllocateTargetCode(ctx, worldId);
                if (targetCode == null) continue;

                var (spawnX, spawnY) = FindSpawnPosition(ctx, world, alliance, ctx.Rng);
                var botTank = BuildTank(ctx, worldId, ctx.Sender, "Bot", targetCode, "", alliance, spawnX, spawnY, AIBehavior.GameAI);
                ctx.Db.tank.Insert(botTank);
            }
        }

        Log.Info($"Player {player.Value.Name} created world '{world.Name}' ({world.Id})");
    }
}
