using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void joinWorld(ReducerContext ctx, string? worldId, string passcode)
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
            world = ctx.Db.world.GameState_IsHomeWorld_IsPrivate.Filter((GameState.Playing, false, false)).FirstOrDefault();
            
            if (world == null)
            {
                Log.Info("No public worlds available, creating new world");
                var newWorldId = GenerateWorldId(ctx);
                var (baseTerrain, terrainDetails, traversibilityMap, projectileCollisionMap) = GenerateTerrainCommand(ctx);

                world = CreateWorld(
                    ctx,
                    newWorldId,
                    "Public Game",
                    baseTerrain,
                    terrainDetails,
                    traversibilityMap,
                    projectileCollisionMap,
                    false,
                    ""
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

            if (world.Value.HasPasscode)
            {
                if (string.IsNullOrEmpty(passcode))
                {
                    Log.Error($"World {worldId} requires a passcode");
                    return;
                }
                
                var worldPasscode = ctx.Db.world_passcode.WorldId.Find(worldId);
                if (worldPasscode == null || worldPasscode.Value.Passcode != passcode)
                {
                    Log.Error($"Invalid passcode for world {worldId}");
                    return;
                }
            }
        }

        CleanupHomeworldAndJoinCommand(ctx, world.Value.Id);

        Log.Info($"Player {player.Value.Name} joined world {world.Value.Id}");
    }
}
