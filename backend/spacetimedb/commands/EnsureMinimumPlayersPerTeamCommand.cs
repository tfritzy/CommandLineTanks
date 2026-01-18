using SpacetimeDB;
using static Types;

public static partial class Module
{
    public static void EnsureMinimumPlayersPerTeam(ReducerContext ctx, string gameId)
    {
        var game = ctx.Db.game.Id.Find(gameId);
        if (game == null || game.Value.MinPlayersPerTeam <= 0)
        {
            return;
        }

        var alliance0Players = 0;
        var alliance1Players = 0;

        foreach (var tank in ctx.Db.tank.GameId.Filter(gameId))
        {
            if (tank.Alliance == 0)
            {
                alliance0Players++;
            }
            else if (tank.Alliance == 1)
            {
                alliance1Players++;
            }
        }

        int minPlayers = game.Value.MinPlayersPerTeam;

        if (alliance0Players < minPlayers)
        {
            int botsNeeded = minPlayers - alliance0Players;
            for (int i = 0; i < botsNeeded; i++)
            {
                var targetCode = AllocateTargetCode(ctx, gameId);
                if (targetCode == null) continue;

                var (spawnX, spawnY) = FindSpawnPosition(ctx, game.Value, 0, ctx.Rng);
                var botName = GenerateBotName(ctx, gameId);
                var (botTank, botTransform) = BuildTank(
                    ctx: ctx,
                    gameId: gameId,
                    owner: Identity.From(new byte[32]),
                    name: botName,
                    targetCode: targetCode,
                    joinCode: "",
                    alliance: 0,
                    positionX: spawnX,
                    positionY: spawnY,
                    aiBehavior: AIBehavior.GameAI);
                AddTankToGame(ctx, botTank, botTransform);
            }
        }

        if (alliance1Players < minPlayers)
        {
            int botsNeeded = minPlayers - alliance1Players;
            for (int i = 0; i < botsNeeded; i++)
            {
                var targetCode = AllocateTargetCode(ctx, gameId);
                if (targetCode == null) continue;

                var (spawnX, spawnY) = FindSpawnPosition(ctx, game.Value, 1, ctx.Rng);
                var botName = GenerateBotName(ctx, gameId);
                var (botTank, botTransform) = BuildTank(
                    ctx: ctx,
                    gameId: gameId,
                    owner: Identity.From(new byte[32]),
                    name: botName,
                    targetCode: targetCode,
                    joinCode: "",
                    alliance: 1,
                    positionX: spawnX,
                    positionY: spawnY,
                    aiBehavior: AIBehavior.GameAI);
                AddTankToGame(ctx, botTank, botTransform);
            }
        }
    }
}
