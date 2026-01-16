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

    public static void SpawnInitialBots(ReducerContext ctx, string gameId, Game game)
    {
        for (int alliance = 0; alliance < 2; alliance++)
        {
            for (int i = 0; i < 2; i++)
            {
                var targetCode = AllocateTargetCode(ctx, gameId);
                if (targetCode == null) continue;

                var (spawnX, spawnY) = FindSpawnPosition(ctx, game, alliance, ctx.Rng);
                var botName = GenerateBotName(ctx, gameId);
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
                AddTankToGame(ctx, botTank, botTransform);
            }
        }
    }
}
