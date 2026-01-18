using SpacetimeDB;
using static Types;

public static partial class Module
{
    [Reducer(ReducerKind.Init)]
    public static void Init(ReducerContext ctx)
    {
        ctx.Db.ScheduledGameCleanup.Insert(new ScheduledGameCleanup
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = CLEANUP_INTERVAL_MICROS })
        });

        ctx.Db.ScheduledGameActivityCheck.Insert(new ScheduledGameActivityCheck
        {
            ScheduledId = 0,
            ScheduledAt = new ScheduleAt.Interval(new TimeDuration { Microseconds = HOMEWORLD_ACTIVITY_CHECK_INTERVAL_MICROS })
        });
    }

    public static void SpawnInitialBots(ReducerContext ctx, string gameId, Game game, int totalBotCount = 4)
    {
        int botsPerAlliance = totalBotCount / 2;
        int extraBot = totalBotCount % 2;
        
        for (int alliance = 0; alliance < 2; alliance++)
        {
            int botsForThisAlliance = botsPerAlliance + (alliance == 0 ? extraBot : 0);
            
            for (int i = 0; i < botsForThisAlliance; i++)
            {
                var targetCode = AllocateTargetCodeCommand.Call(ctx, gameId);
                if (targetCode == null) continue;

                var (spawnX, spawnY) = FindSpawnPositionCommand.Call(ctx, game, alliance, ctx.Rng);
                var botName = GenerateBotNameCommand.Call(ctx, gameId);
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
    }
}
