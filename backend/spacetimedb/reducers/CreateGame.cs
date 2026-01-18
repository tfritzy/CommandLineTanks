using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer]
    public static void createGame(ReducerContext ctx, string joinCode, GameVisibility visibility, int botCount, long gameDurationMicros, int width, int height)
    {
        Log.Info($"{ctx.Sender} is creating a game (visibility: {visibility}, bots: {botCount}, size: {width}x{height})");

        var player = ctx.Db.player.Identity.Find(ctx.Sender);
        if (player == null)
        {
            Log.Error("Player not found for identity");
            return;
        }

        if (width < 10 || width > 200)
        {
            Log.Error($"Invalid width: {width}. Must be between 10 and 200.");
            return;
        }

        if (height < 10 || height > 200)
        {
            Log.Error($"Invalid height: {height}. Must be between 10 and 200.");
            return;
        }

        var gameId = GenerateGameId(ctx);

        var (baseTerrain, terrainDetails, traversibilityMap, projectileTraversibilityMap) = GenerateTerrainCommand(ctx, width, height);

        int minPlayersPerTeam = botCount / 2;

        var game = CreateGame.Call(
            ctx,
            gameId,
            baseTerrain,
            terrainDetails,
            traversibilityMap,
            projectileTraversibilityMap,
            width,
            height,
            visibility,
            gameDurationMicros,
            ctx.Sender,
            minPlayersPerTeam
        );

        CleanupHomegameAndJoinCommand(ctx, game.Id, joinCode);

        int botsPerAlliance = botCount / 2;
        int extraBot = botCount % 2;
        
        for (int alliance = 0; alliance < 2; alliance++)
        {
            int botsForThisAlliance = botsPerAlliance + (alliance == 0 ? extraBot : 0);
            
            for (int i = 0; i < botsForThisAlliance; i++)
            {
                var targetCode = AllocateTargetCode.Call(ctx, gameId);
                if (targetCode == null) continue;

                var (spawnX, spawnY) = FindSpawnPosition.Call(ctx, game, alliance, ctx.Rng);
                var botName = GenerateBotName.Call(ctx, gameId);
                var (botTank, botTransform) = BuildTank(
                    ctx: ctx,
                    gameId: gameId,
                    owner: Identity.From(new byte[32]),
                    name: botName,
                    targetCode: targetCode,
                    joinCode: "",
                    alliance: alliance,
                    positionX: spawnX,
                    positionY: spawnY,
                    aiBehavior: AIBehavior.GameAI);
                AddTankToGame.Call(ctx, botTank, botTransform);
            }
        }

        ctx.Db.message.Insert(new Message
        {
            Id = GenerateId(ctx, "msg"),
            GameId = game.Id,
            Sender = "System",
            SenderIdentity = null,
            Text = "Game started!",
            Timestamp = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch
        });

        Log.Info($"Player {player.Value.Name} created game ({game.Id})");
    }
}
