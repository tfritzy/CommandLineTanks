using SpacetimeDB;
using System.Linq;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void joinWorld(ReducerContext ctx, string? worldId, string? currentWorldId, string joinCode)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        World? world = null;

        if (string.IsNullOrEmpty(worldId))
        {
            var worlds = ctx.Db.world.GameState_IsHomeWorld_Visibility.Filter((GameState.Playing, false, WorldVisibility.Public));
            world = worlds.FirstOrDefault(w => w.Id != currentWorldId);
            
            if (world == null || string.IsNullOrEmpty(world.Value.Id))
            {
                Log.Info("No public worlds available, creating new world");
                var newWorldId = GenerateWorldId(ctx);
                var width = TerrainGenerator.GetWorldWidth();
                var height = TerrainGenerator.GetWorldHeight();
                var (baseTerrain, terrainDetails, traversibilityMap) = GenerateTerrainCommand(ctx, width, height);

                world = CreateWorld(
                    ctx,
                    newWorldId,
                    baseTerrain,
                    terrainDetails,
                    traversibilityMap,
                    width,
                    height,
                    WorldVisibility.Public
                );

                SpawnInitialBots(ctx, newWorldId, world.Value);
            }
        }
        else
        {
            world = ctx.Db.world.Id.Find(worldId);
            if (world == null)
            {
                Log.Error($"World {worldId} not found");
                return;
            }
        }

        CleanupHomeworldAndJoinCommand(ctx, world.Value.Id, joinCode);

        Log.Info($"Player {player.Value.Name} joined world {world.Value.Id}");
    }
}
