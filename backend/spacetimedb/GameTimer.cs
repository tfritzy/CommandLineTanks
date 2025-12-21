using SpacetimeDB;
using static Types;
using static Module;

public static partial class GameTimer
{
    [Table(Scheduled = nameof(CheckGameTime))]
    [SpacetimeDB.Index.BTree(Columns = new[] { nameof(WorldId) })]
    public partial struct ScheduledGameTimeCheck
    {
        [AutoInc]
        [PrimaryKey]
        public ulong ScheduledId;
        public ScheduleAt ScheduledAt;
        public string WorldId;
    }

    [Reducer]
    public static void CheckGameTime(ReducerContext ctx, ScheduledGameTimeCheck args)
    {
        var world = ctx.Db.world.Id.Find(args.WorldId);
        if (world == null || world.Value.GameState != GameState.Playing)
        {
            return;
        }

        var currentTime = (ulong)ctx.Timestamp.MicrosecondsSinceUnixEpoch;
        var gameElapsedMicros = currentTime - world.Value.GameStartedAt;

        if (gameElapsedMicros >= (ulong)world.Value.GameDurationMicros)
        {
            var score = ctx.Db.score.WorldId.Find(args.WorldId);
            if (score != null)
            {
                var updatedWorld = world.Value with { GameState = GameState.Results };
                ctx.Db.world.Id.Update(updatedWorld);

                ctx.Db.ScheduledWorldReset.Insert(new ProjectileUpdater.ScheduledWorldReset
                {
                    ScheduledId = 0,
                    ScheduledAt = new ScheduleAt.Time(ctx.Timestamp + new TimeDuration { Microseconds = Module.WORLD_RESET_DELAY_MICROS }),
                    WorldId = args.WorldId
                });

                int team0Kills = score.Value.Kills.Length > 0 ? score.Value.Kills[0] : 0;
                int team1Kills = score.Value.Kills.Length > 1 ? score.Value.Kills[1] : 0;
                Log.Info($"Game time limit reached! Team 0: {team0Kills} kills, Team 1: {team1Kills} kills. Game ending in 30 seconds...");
            }
        }
    }
}
