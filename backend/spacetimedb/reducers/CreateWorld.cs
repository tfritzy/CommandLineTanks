using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void createWorld(ReducerContext ctx, string joinCode, string worldName, bool isPrivate, string passcode, int botCount, long gameDurationMicros)
    {
        Log.Info($"{ctx.Sender} is creating a world '{worldName}' (private: {isPrivate}, bots: {botCount})");

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var worldId = GenerateWorldId(ctx);

        var (baseTerrain, terrainDetails) = TerrainGenerator.GenerateTerrain(ctx.Rng);
        var terrainDetailArray = TerrainGenerator.ConvertToArray(
            terrainDetails,
            TerrainGenerator.GetWorldWidth(),
            TerrainGenerator.GetWorldHeight()
        );
        var traversibilityMap = TerrainGenerator.CalculateTraversibility(baseTerrain, terrainDetailArray);
        var projectileCollisionMap = TerrainGenerator.CalculateProjectileCollisionMap(baseTerrain, terrainDetailArray);

        var world = CreateWorld(
            ctx,
            worldId,
            worldName,
            baseTerrain,
            terrainDetails.ToArray(),
            traversibilityMap,
            projectileCollisionMap,
            isPrivate,
            passcode,
            gameDurationMicros
        );

        CleanupHomeworldAndJoin(ctx, world.Id, joinCode);

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

    private static void CleanupHomeworldAndJoin(ReducerContext ctx, string worldId, string joinCode)
    {
        var identityString = ctx.Sender.ToString().ToLower();
        var homeworldTanks = ctx.Db.tank.WorldId.Filter(identityString).Where(t => t.Owner == ctx.Sender);
        foreach (var homeworldTank in homeworldTanks)
        {
            var fireState = ctx.Db.tank_fire_state.TankId.Find(homeworldTank.Id);
            if (fireState != null)
            {
                ctx.Db.tank_fire_state.TankId.Delete(homeworldTank.Id);
            }
            ctx.Db.tank.Id.Delete(homeworldTank.Id);
        }

        if (!HasAnyTanksInWorld(ctx, identityString))
        {
            StopWorldTickers(ctx, identityString);
        }

        var tank = CreateTankInWorld(ctx, worldId, ctx.Sender, joinCode);
        if (tank != null)
        {
            ctx.Db.tank.Insert(tank.Value);
        }
    }
}
