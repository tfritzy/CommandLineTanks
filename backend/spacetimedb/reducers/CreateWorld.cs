using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void createWorld(ReducerContext ctx, string joinCode, bool isPrivate, string? passcode)
    {
        Log.Info($"{ctx.Sender} is creating a world (private: {isPrivate})");

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        var worldId = GenerateId(ctx, "wld");
        var worldName = $"{player.Value.Name}'s Game";

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
            passcode
        );

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
            Log.Info($"Deleted homeworld tank {homeworldTank.Id} for player {player.Value.Name}");
        }

        if (!HasAnyTanksInWorld(ctx, identityString))
        {
            StopWorldTickers(ctx, identityString);
        }

        var tank = CreateTankInWorld(ctx, world.Id, ctx.Sender, joinCode);
        if (tank != null)
        {
            ctx.Db.tank.Insert(tank.Value);
            Log.Info($"Player {player.Value.Name} created world {world.Name} ({world.Id}) with tank {tank.Value.Id} (joinCode: {joinCode})");
        }

        SpawnInitialBots(ctx, worldId, world);
    }
}
