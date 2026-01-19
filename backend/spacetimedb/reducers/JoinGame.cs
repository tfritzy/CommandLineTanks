using SpacetimeDB;
using System.Linq;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void joinGame(ReducerContext ctx, string? gameId, string? currentGameId, string joinCode)
    {
        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        Game? game = null;

        if (string.IsNullOrEmpty(gameId))
        {
            var games = ctx.Db.game.GameState_GameType_Visibility.Filter((GameState.Playing, GameType.Game, GameVisibility.Public));
            game = games.FirstOrDefault(w => w.Id != currentGameId);
            
            if (game == null || string.IsNullOrEmpty(game.Value.Id))
            {
                Log.Info("No public games available, creating new game");
                var newGameId = GenerateGameId(ctx);
                var (width, height) = TerrainGenerator.GenerateRandomGameDimensions(ctx.Rng);
                var (baseTerrain, terrainDetails, traversibilityMap, projectileTraversibilityMap) = GenerateTerrainCommand(ctx, width, height);

                GenerateDestinationAnchors.Call(ctx, newGameId, traversibilityMap, width, height);

                int botsPerTeam = ctx.Rng.Next(2, 4);
                int minPlayersPerTeam = botsPerTeam;

                game = CreateGame.Call(
                    ctx,
                    newGameId,
                    baseTerrain,
                    terrainDetails,
                    traversibilityMap,
                    projectileTraversibilityMap,
                    width,
                    height,
                    GameVisibility.Public,
                    minPlayersPerTeam: minPlayersPerTeam
                );

                int totalBotCount = botsPerTeam * 2;
                SpawnInitialBots(ctx, newGameId, game.Value, totalBotCount);
            }
        }
        else
        {
            game = ctx.Db.game.Id.Find(gameId);
            if (game == null)
            {
                Log.Error($"Game {gameId} not found");
                return;
            }
        }

        CleanupHomegameAndJoinCommand(ctx, game.Value.Id, joinCode);

        Log.Info($"Player {player.Value.Name} joined game {game.Value.Id}");
    }
}
